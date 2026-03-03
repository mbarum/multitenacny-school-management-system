export class CreateAttendanceDto {
  studentId: string;
  classLevelId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
}
