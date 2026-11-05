import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';

const eventSchema = new Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    lieu: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    // Relation 1 -> N : un utilisateur publie plusieurs événements
    auteur: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type Event = InferSchemaType<typeof eventSchema>;
export type EventDocument = HydratedDocument<Event>;

export const EventModel = model('Event', eventSchema);
