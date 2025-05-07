import { model, Model, Schema } from 'mongoose'
import { ITask, TaskDocument } from '../types/task.types.js'

const TaskSchema = new Schema<ITask, Model<TaskDocument>>({
    taskName: {
        type: String,
        required: true,
        trim: true
    },
    taskDesc: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["To do", "In progress", "Completed"],
        default: "To do"
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    deadline: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }
);

const Task = model<ITask, Model<TaskDocument>>("Task", TaskSchema);

export default Task;