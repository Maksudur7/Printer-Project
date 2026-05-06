import { FileInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { UpdateOrderDto } from './dto/update-order.dto';
@Controller('v1/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: process.env.VERCEL ? '/tmp' : './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return await this.orderService.createOrder(body, file);
  }

  @Get('pending/:kioskId')
  async getPending(@Param('kioskId') kioskId: string) {
    return await this.orderService.getPendingOrders(kioskId);
  }

  @Get()
  async findAll() {
    return await this.orderService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.orderService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: any) {
    console.log(id);
    return await this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.orderService.remove(id);
  }
}
