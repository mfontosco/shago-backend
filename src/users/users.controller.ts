import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { User } from './entities/user.entities';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthGuard } from '../guards/auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService){}
    


    @Post("register")
    async registerUser(@Body() dto: RegisterDto):Promise<User>{
        return this.userService.createUser(dto)
    }

    @Get("/")
    async getAllUsers():Promise<User[]>{
        return this.userService.getUsers()
    }
    @UseGuards(AuthGuard)
    @Get("profile")
    async getUserProfile(@Request() req){
        return req.user
    }
    @UseGuards(AuthGuard)
    @Get("/:id")
    async getUserById(@Param("id")id: string):Promise<User>{
        return this.userService.findById(id)
    }
   

    @Patch(":id")
    async updateUserProfile(@Param("id")id:string,@Body()dto:UpdateUserDto):Promise<User>{
        return this.userService.updateUserProfile(id,dto)
    }
}
