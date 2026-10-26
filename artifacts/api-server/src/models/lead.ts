import {
  model,
  models,
  Schema,
  Types,
  type InferSchemaType,
  type Model,
} from "mongoose";

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, default: null, trim: true, maxlength: 254 },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    destination: { type: String, required: true, trim: true, maxlength: 240 },
    movingDate: { type: String, required: true },
    propertyType: {
      type: String,
      required: true,
      enum: ["house", "apartment", "office", "other"],
    },
    services: {
      type: [String],
      required: true,
      enum: [
        "household-shifting",
        "office-relocation",
        "packing-unpacking",
        "loading-unloading",
        "local-moving",
        "long-distance-moving",
      ],
    },
    additionalDetails: { type: String, default: "", maxlength: 3000 },
    source: { type: String, required: true, maxlength: 120 },
    status: {
      type: String,
      required: true,
      enum: ["new", "contacted", "quoted", "booked", "closed"],
      default: "new",
    },
    internalNotes: { type: String, default: "", maxlength: 5000 },
  },
  {
    collection: "moving_enquiries",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ phone: 1 });

export type LeadDocument = InferSchemaType<typeof leadSchema> & {
  _id: Types.ObjectId;
};

const existingLeadModel = models.MovingEnquiry as Model<LeadDocument> | undefined;
export const LeadModel =
  existingLeadModel ?? model<LeadDocument>("MovingEnquiry", leadSchema);
