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
exports.PollStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PollStatus;
(function (PollStatus) {
    PollStatus["DRAFT"] = "draft";
    PollStatus["ACTIVE"] = "active";
    PollStatus["CLOSED"] = "closed";
})(PollStatus || (exports.PollStatus = PollStatus = {}));
const pollSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(PollStatus),
        default: PollStatus.DRAFT,
    },
    options: [
        {
            text: {
                type: String,
                required: true,
            },
        },
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtual populate for responses
pollSchema.virtual('responses', {
    ref: 'PollResponse',
    localField: '_id',
    foreignField: 'pollId',
    justOne: false,
});
// Update poll status automatically based on dates
pollSchema.pre('save', function (next) {
    const now = new Date();
    if (this.status !== PollStatus.DRAFT) {
        if (this.startDate <= now && this.endDate >= now) {
            this.status = PollStatus.ACTIVE;
        }
        else if (this.endDate < now) {
            this.status = PollStatus.CLOSED;
        }
    }
    next();
});
const Poll = mongoose_1.default.model('Poll', pollSchema);
exports.default = Poll;
