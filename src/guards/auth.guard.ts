import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Observable } from "rxjs";


@Injectable()
 export class AuthGuard implements CanActivate{
    constructor(private readonly jwtService:JwtService){}

    async canActivate (context: ExecutionContext):  Promise<boolean>  {
        const request = context.switchToHttp().getRequest()
        const token  = this.extractTokenFromHeader(request)

        if(!token){
            throw new UnauthorizedException("token invalid")
        }
        console.log("token",token)
        try {
            const payload = await this.jwtService.verifyAsync(token)
            console.log("payload---------",payload)
            request['user'] = payload
        } catch (error) {
            console.log("error",error)
            throw new UnauthorizedException()
        }
        return true
     }

    private extractTokenFromHeader(request:Request): string | undefined{
        const [type, token] = request.headers.authorization?.split(" ")??[];
        console.log("type",type,token)
        return type === "Bearer" ? token : undefined
     }
 }