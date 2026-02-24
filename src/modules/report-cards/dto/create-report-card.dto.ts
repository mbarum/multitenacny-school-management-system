export class CreateReportCardDto {
  studentId: string;
  examinationId: string;
  marks: number;
  grade?: string;
  remarks?: string;
}
