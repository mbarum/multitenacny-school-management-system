export class CreateAttendanceDto {
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
}
