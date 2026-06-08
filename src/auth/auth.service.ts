import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/users/dtos/login.dto';
import { User } from 'src/users/entities/user.entities';
import { UsersService } from 'src/users/users.service';
import  * as bcrypt from "bcrypt"

@Injectable()
export class AuthService {
    constructor(
        private readonly userService:UsersService,
        private readonly jwtService: JwtService
    ){}

    async login(dto:LoginDto){
        const {email,password} = dto
        const user = await this.userService.findUserByEmail(email)
        if(!user){
        throw new UnauthorizedException("invalid user details, verify your email")
        }
        const isMatch = bcrypt.compareSync(password,user.password)
        if(!isMatch){
            throw new UnauthorizedException("password mismatch")
        }
        const {password: _ ,...userWithoutPassword} = user
        const payload = {sub: user.id, username: user.email}
        const access_token =  await this.jwtService.signAsync(payload)
        
        return  {...userWithoutPassword,access_token}
    }
}
