import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../users/dtos/login.dto';
import { User } from '../users/entities/user.entities';
import { UsersService } from '../users/users.service';
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

        // ✅ CRITICAL: Include tenant_id in JWT payload for multi-tenancy
        const payload = {
            sub: user.id,
            email: user.email,
            tenant_id: user.tenant_id,  // ← ADDED FOR MULTI-TENANCY
        }
        const access_token =  await this.jwtService.signAsync(payload)

        return  {...userWithoutPassword, access_token, tenant_id: user.tenant_id}
    }
}
