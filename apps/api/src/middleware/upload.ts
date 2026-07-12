import multer from "multer";
import { projectStorageDir, buildStoredFilename } from "../lib/storage";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const projectId = req.params.projectId ?? (req.body?.projectId as string);
    const category = (req.body?.category as string) || "other";
    cb(null, projectStorageDir(projectId, category));
  },
  filename: (_req, file, cb) => {
    cb(null, buildStoredFilename(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
