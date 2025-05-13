import { Injectable } from '@nestjs/common';
import { ManagementClient } from 'auth0';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Auth0Service {
  private auth0: ManagementClient;

  constructor(private configService: ConfigService) {
    this.auth0 = new ManagementClient({
        domain: 'thebigmou.us.auth0.com',
        clientId: 'HzboByDK0egBiGaIhwzfTz3GWOEZeVdO ',
        clientSecret: 'FYVzGlYg5uOz_zv75g5ASQHV6_sECSkPPX4lIiaJhlp2NtgL6tRA8vaJNXSu4HgI',
        audience: 'https://thebigmou.us.auth0.com/api/v2/',
    });
  }

  getManagementClient(): ManagementClient {
    return this.auth0;
  }

  async createAuth0User(email: string, password: string, name: string): Promise<any> {
    return this.auth0.users.create({
      connection: 'Username-Password-Authentication',
      email,
      password,
      name,
      email_verified: false,
      verify_email: true,
    });
  }
}