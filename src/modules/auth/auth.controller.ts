import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  UseGuards,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { type Request, type Response } from 'express';
import { signInSchema, type SignInPayload } from './dto/auth.dto';
import { UserStrategyPayload } from './strategies';
import { TokenGenerationFailedException } from 'src/exceptions';
import { ErrorCodes } from 'src/constants/error-codes';
import { zodToApiSchema } from 'src/utils';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({ schema: zodToApiSchema(signInSchema) })
  @ApiResponse({
    status: 200,
    description: 'Returns access token, refresh token, user id and locale',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signin(@Body() signInPayload: SignInPayload, @Res() res: Response) {
    const user = await this.authService.validateUser(
      signInPayload.email,
      signInPayload.password,
    );
    const result = await this.authService.signin(user);
    res.send(result);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Returns new access and refresh tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 500, description: 'Token generation failed' })
  async refresh(@Req() req: Request & { user: UserStrategyPayload }) {
    const user = req.user;
    try {
      const result = await this.authService.refreshToken(user);
      return result;
    } catch (e) {
      throw new InternalServerErrorException({
        message:
          e instanceof TokenGenerationFailedException
            ? e.message
            : 'Internal Server Error',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  @Post('sign-out')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign out and clear refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  signout(@Res() res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.send({ message: 'Logged out successfully' });
  }
}
