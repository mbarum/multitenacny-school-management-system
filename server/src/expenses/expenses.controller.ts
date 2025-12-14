
import { Controller, Get, Post, Body, Param, Delete, Request, Patch, Res, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpensesService } from './expenses.service';
import { Expense } from '../entities/expense.entity';
import { GetExpensesDto } from './dto/get-expenses.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Role.Admin, Role.Accountant)
  create(@Request() req: any, @Body() createExpenseDto: Omit<Expense, 'id'>) {
    return this.expensesService.create(createExpenseDto, req.user.schoolId);
  }

  @Post('upload-receipt')
  @Roles(Role.Admin, Role.Accountant)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(resolve('.'), 'public', 'uploads'),
      filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
        const randomName = Array(16).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
            return cb(new BadRequestException('Only image files (jpg, jpeg, png) and PDFs are allowed!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
  }))
  async uploadReceipt(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File upload failed.');
    }
    return { url: `/public/uploads/${file.filename}` };
  }

  @Get()
  @Roles(Role.Admin, Role.Accountant)
  findAll(@Request() req: any, @Query() query: GetExpensesDto) {
    return this.expensesService.findAll(query, req.user.schoolId);
  }

  @Get('export')
  @Roles(Role.Admin, Role.Accountant)
  async export(@Request() req: any, @Query() query: GetExpensesDto, @Res() res: any) {
    const csv = await this.expensesService.exportExpenses(req.user.schoolId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csv);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Accountant)
  update(@Request() req: any, @Param('id') id: string, @Body() updateExpenseDto: Partial<Expense>) {
    return this.expensesService.update(id, updateExpenseDto, req.user.schoolId);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Accountant)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.expensesService.remove(id, req.user.schoolId);
  }
}
