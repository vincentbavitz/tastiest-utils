export type EmailTemplate = {
  id: string;
  name: string;
  html: string;
  design: any; // used for unlayer's loadDesign method
  isApproved: boolean;

  // timestmaps in ms
  createdAt: number;
  editedAt: number;
  approvedAt: number | null;
};

export type EmailPrototype = {
  id: string;
  subject: string;
  template: string; // template ID
  to: string[];
};

export type Email = EmailPrototype & {
  headers?: { [key: string]: string };
  from: string;

  // Body as HTML with params filled in. Eg {{ firstName }} -> Jessica
  body: string;
  isSent: boolean;

  // Timestamps in ms
  sentAt: number;
  scheduledFor?: number;
};
