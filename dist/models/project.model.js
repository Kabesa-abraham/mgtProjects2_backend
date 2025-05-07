import { model, Schema } from 'mongoose';
const ProjectSchema = new Schema({
    projectName: {
        type: String,
        required: true,
        trim: true
    },
    projectDesc: {
        type: String,
        trim: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    }
}, { timestamps: true });
const Project = model("Project", ProjectSchema);
export default Project;
