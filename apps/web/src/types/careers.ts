import type { JobPostingDTO } from "@rvcc/schemas";

export type JobPosition = JobPostingDTO & {
  postedAt?: string;
  type?: string;
};

export type { JobPostingDTO };


