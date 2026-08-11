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

    /**
     * Create user with either RegisterDto or direct user data
     * Supports both traditional registration and vendor tenant registration
     */
    async createUser(dto: RegisterDto | any): Promise<User>{
        const { password, email } = dto;

        // Check if user already exists
        const userExists = await this.userRepository.findOne({ where: { email } });
        if (userExists) {
            throw new BadRequestException("user with this email already exists, please login");
        }

        // Use provided hashed password (for vendor registration) or hash it
        const finalPassword = password && password.length > 50 ? password : await bcrypt.hash(password, 10);

        const newUser = await this.userRepository.create({
            ...dto,
            password: finalPassword,
            active: true,
        });

        return this.userRepository.save(newUser);
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
