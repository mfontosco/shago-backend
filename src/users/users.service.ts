import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from "bcrypt"
import { UpdateUserDto } from './dtos/update-user.dto';
@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository:Repository<User>
    ){}

    async createUser(dto:RegisterDto):Promise<User>{
        const {password,active} = dto
        const userExists = await this.userRepository.findOne({where:{email:dto.email}})
        if(userExists){
            throw new BadRequestException("user with this email already exists,please login")
        }
        const hashPassword = await bcrypt.hash(password,10)
        const newUser = await this.userRepository.create({...dto,password:hashPassword,active:true})

        return this.userRepository.save(newUser)
    }


    async findUserByEmail(email:string):Promise<User | null>{
        return this.userRepository.findOne({where:{email}})
    }

    async findById(id:string):Promise<User>{
        const user = await this.userRepository.findOne({where:{id}})
        if(!user) throw new NotFoundException("user not found")

            return user
    }
    async getUsers(): Promise<User[]>{
        const users = this.userRepository.find()
        return users
    }

    async updateUserProfile(id:string,dto:UpdateUserDto):Promise<User>{
        const userExists = await this.userRepository.findOne({where:{id}})
        if(!userExists){
            throw new NotFoundException("This user doesn't exist")
        }
        Object.assign(userExists,dto)
        return this.userRepository.save(userExists)
    }
    // async updateRefresshToken(id:string, token: string | null): Promise<void>{
    //     await this.userRepository.update(id,refres)
    // }

    
}
