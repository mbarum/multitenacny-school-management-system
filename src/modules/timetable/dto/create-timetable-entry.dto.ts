export class CreateTimetableEntryDto {
  classLevel: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
}
