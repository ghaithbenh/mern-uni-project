import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';

const feedbackSchema = new Schema(
  {
    texte: { type: String, required: true, trim: true },
    note: { type: Number, required: true, min: 1, max: 5 },
    // Relation 1 -> N : un événement reçoit plusieurs avis
    evenement: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    // Relation 1 -> N : un utilisateur écrit plusieurs avis
    auteur: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type Feedback = InferSchemaType<typeof feedbackSchema>;
export type FeedbackDocument = HydratedDocument<Feedback>;

export const FeedbackModel = model('Feedback', feedbackSchema);
