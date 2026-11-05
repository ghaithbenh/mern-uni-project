import { Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { EventModel } from '../events/event.model.js';
import { FeedbackModel } from '../feedbacks/feedback.model.js';
import { UserModel } from '../users/user.model.js';

const DAY_MS = 86_400_000;
const TIME_ZONE = 'Africa/Tunis';

export const DASHBOARD_PERIODS = [7, 14, 30, 90] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export interface DailyActivity {
  date: string;
  users: number;
  events: number;
  feedbacks: number;
}

export interface RatingBucket {
  note: number;
  count: number;
}

export interface TopEvent {
  id: string;
  titre: string;
  feedbacks: number;
  note: number | null;
  date: string;
}

export interface AdminStats {
  users: number;
  admins: number;
  events: number;
  feedbacks: number;

  // Fenêtre analysée
  periodDays: DashboardPeriod;
  newUsers: number;
  newEvents: number;
  newFeedbacks: number;

  // Indicateurs dérivés
  averageNote: number | null;
  upcomingEvents: number;
  series: DailyActivity[];
  ratings: RatingBucket[];
  topEvents: TopEvent[];
}

interface CountByDayRow {
  _id: string;
  count: number;
}

interface RatingRow {
  _id: number;
  count: number;
}

interface TopEventRow {
  _id: Types.ObjectId;
  count: number;
  note: number;
}

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

type DayPart = 'year' | 'month' | 'day';

const toDayKey = (date: Date): string => {
  const parts = dayFormatter.formatToParts(date);
  const pick = (type: DayPart): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${pick('year')}-${pick('month')}-${pick('day')}`;
};

const buildDayKeys = (periodDays: number): string[] => {
  const now = Date.now();
  return Array.from({ length: periodDays }, (_, index) =>
    toDayKey(new Date(now - (periodDays - 1 - index) * DAY_MS))
  );
};

const dayGroup = (start: Date): PipelineStage[] => [
  { $match: { createdAt: { $gte: start } } },
  {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$createdAt',
          timezone: TIME_ZONE,
        },
      },
      count: { $sum: 1 },
    },
  },
];

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

export class AdminService {
  getStats = async (periodDays: DashboardPeriod): Promise<AdminStats> => {
    const now = new Date();
    const start = new Date(now.getTime() - periodDays * DAY_MS);
    const dayKeys = buildDayKeys(periodDays);

    const [userRows, eventRows, feedbackRows, ratingsRows, topRows, users, admins, events, feedbacks, upcomingEvents] =
      await Promise.all([
        UserModel.aggregate<CountByDayRow>(dayGroup(start)),
        EventModel.aggregate<CountByDayRow>(dayGroup(start)),
        FeedbackModel.aggregate<CountByDayRow>(dayGroup(start)),
        FeedbackModel.aggregate<RatingRow>([
          { $group: { _id: '$note', count: { $sum: 1 } } },
        ]),
        FeedbackModel.aggregate<TopEventRow>([
          {
            $group: {
              _id: '$evenement',
              count: { $sum: 1 },
              note: { $avg: '$note' },
            },
          },
          { $sort: { count: -1, note: -1 } },
          { $limit: 5 },
        ]),
        UserModel.countDocuments(),
        UserModel.countDocuments({ role: 'admin' }),
        EventModel.countDocuments(),
        FeedbackModel.countDocuments(),
        EventModel.countDocuments({ date: { $gte: now } }),
      ]);

    const userByDay = new Map(userRows.map((row) => [row._id, row.count]));
    const eventByDay = new Map(eventRows.map((row) => [row._id, row.count]));
    const feedbackByDay = new Map(feedbackRows.map((row) => [row._id, row.count]));

    const series: DailyActivity[] = dayKeys.map((date) => ({
      date,
      users: userByDay.get(date) ?? 0,
      events: eventByDay.get(date) ?? 0,
      feedbacks: feedbackByDay.get(date) ?? 0,
    }));

    const ratings: RatingBucket[] = [1, 2, 3, 4, 5].map((note) => ({
      note,
      count: ratingsRows.find((row) => row._id === note)?.count ?? 0,
    }));

    const noteTotal = sum(ratings.map((bucket) => bucket.count));
    const noteSum = sum(ratings.map((bucket) => bucket.note * bucket.count));
    const averageNote =
      noteTotal === 0 ? null : Math.round((noteSum / noteTotal) * 10) / 10;

    const topDocs = await EventModel.find({
      _id: { $in: topRows.map((row) => row._id) },
    }).select('titre date');

    const eventById = new Map(
      topDocs.map((event) => [event._id.toString(), event])
    );

    const topEvents: TopEvent[] = [];
    for (const row of topRows) {
      const event = eventById.get(row._id.toString());
      if (!event) continue;

      topEvents.push({
        id: event._id.toString(),
        titre: event.titre,
        feedbacks: row.count,
        note: typeof row.note === 'number' ? Math.round(row.note * 10) / 10 : null,
        date: event.date.toISOString(),
      });
    }

    return {
      users,
      admins,
      events,
      feedbacks,
      periodDays,
      newUsers: sum(series.map((point) => point.users)),
      newEvents: sum(series.map((point) => point.events)),
      newFeedbacks: sum(series.map((point) => point.feedbacks)),
      averageNote,
      upcomingEvents,
      series,
      ratings,
      topEvents,
    };
  };
}
