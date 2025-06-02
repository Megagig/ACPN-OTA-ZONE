"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = exports.EventStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var EventStatus;
(function (EventStatus) {
    EventStatus["DRAFT"] = "draft";
    EventStatus["PUBLISHED"] = "published";
    EventStatus["COMPLETED"] = "completed";
    EventStatus["CANCELLED"] = "cancelled";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var EventType;
(function (EventType) {
    EventType["CONFERENCE"] = "conference";
    EventType["WORKSHOP"] = "workshop";
    EventType["SEMINAR"] = "seminar";
    EventType["TRAINING"] = "training";
    EventType["MEETING"] = "meetings";
    EventType["STATE_EVENT"] = "state_events";
    EventType["SOCIAL"] = "social";
    EventType["OTHER"] = "other";
})(EventType || (exports.EventType = EventType = {}));
const eventSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    eventType: {
        type: String,
        enum: Object.values(EventType),
        required: [true, 'Event type is required'],
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    location: {
        type: mongoose_1.default.Schema.Types.Mixed,
        required: [true, 'Location is required'],
    },
    imageUrl: {
        type: String,
    },
    organizer: {
        type: String,
        required: [true, 'Organizer is required'],
    },
    requiresRegistration: {
        type: Boolean,
        default: false,
    },
    registrationFee: {
        type: Number,
        required: function () {
            return this.requiresRegistration === true;
        },
    },
    capacity: {
        type: Number,
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(EventStatus),
        default: EventStatus.DRAFT,
    },
    registrationDeadline: {
        type: Date,
    },
    isAttendanceRequired: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtual populate for registrations
eventSchema.virtual('registrations', {
    ref: 'EventRegistration',
    localField: '_id',
    foreignField: 'eventId',
    justOne: false,
});
// Virtual populate for attendance
eventSchema.virtual('attendance', {
    ref: 'EventAttendance',
    localField: '_id',
    foreignField: 'eventId',
    justOne: false,
});
// Update event status automatically based on dates
eventSchema.pre('save', function (next) {
    // Only auto-update status if it's not being explicitly set
    if (!this.isModified('status')) {
        const now = new Date();
        if (this.startDate <= now && this.endDate >= now) {
            this.status = EventStatus.PUBLISHED;
        }
        else if (this.endDate < now) {
            this.status = EventStatus.COMPLETED;
        }
        // Don't change if it's a future event (leave as DRAFT or PUBLISHED)
    }
    next();
});
const Event = mongoose_1.default.model('Event', eventSchema);
exports.default = Event;
