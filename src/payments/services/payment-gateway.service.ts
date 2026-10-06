import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class PaymentGatewayService {
  private paystackUrl = "https://api.paystack.co";
  private flutterwaveUrl = "https://api.flutterwave.com/v3";

  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  async initializePaystackPayment(email: string, amount: number, reference: string, metadata: any) {
    const secretKey = this.configService.get<string>("PAYSTACK_SECRET_KEY");
    if (!secretKey) throw new BadRequestException("Paystack not configured");

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.paystackUrl}/transaction/initialize`,
          {
            email,
            amount: amount * 100, // Convert to kobo
            reference,
            metadata,
          },
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
            },
          },
        ),
      );

      const data = (response.data as any);
      return {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      };
    } catch (error: any) {
      throw new BadRequestException(`Paystack error: ${error.message}`);
    }
  }

  async verifyPaystackPayment(reference: string) {
    const secretKey = this.configService.get<string>("PAYSTACK_SECRET_KEY");
    if (!secretKey) throw new BadRequestException("Paystack not configured");

    try {
      const response = await firstValueFrom(
        this.http.get(`${this.paystackUrl}/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${secretKey}` },
        }),
      );

      const data = response.data as any;
      if (data.data.status === "success") {
        return {
          status: "success",
          amount: data.data.amount / 100,
        };
      }
      return { status: "failed", amount: 0 };
    } catch (error: any) {
      throw new BadRequestException(`Verification error: ${error.message}`);
    }
  }

  async initializeFlutterwavePayment(
    email: string,
    amount: number,
    currency: string,
    txRef: string,
    customerName: string,
    redirectUrl: string,
    metadata: any,
  ) {
    const secretKey = this.configService.get<string>("FLUTTERWAVE_SECRET_KEY");
    if (!secretKey) throw new BadRequestException("Flutterwave not configured");

    try {
      const response = (await firstValueFrom(
        this.http.post(
          `${this.flutterwaveUrl}/payments`,
          {
            tx_ref: txRef,
            amount,
            currency,
            redirect_url: redirectUrl,
            payment_options: "card,mobile_money",
            customer: { email, name: customerName },
            meta: metadata,
          },
          {
            headers: { Authorization: `Bearer ${secretKey}` },
          },
        ),
      )) as any;

      return {
        link: response.data.data.link,
        tx_ref: response.data.data.tx_ref,
      };
    } catch (error: any) {
      throw new BadRequestException(`Flutterwave error: ${error.message}`);
    }
  }

  async verifyFlutterwavePayment(txRef: string) {
    const secretKey = this.configService.get<string>("FLUTTERWAVE_SECRET_KEY");
    if (!secretKey) throw new BadRequestException("Flutterwave not configured");

    try {
      const response = (await firstValueFrom(
        this.http.get(
          `${this.flutterwaveUrl}/transactions/verify_by_reference?tx_ref=${txRef}`,
          {
            headers: { Authorization: `Bearer ${secretKey}` },
          },
        ),
      )) as any;

      if (response.data.data.status === "successful") {
        return {
          status: "success",
          amount: response.data.data.amount,
        };
      }
      return { status: "failed", amount: 0 };
    } catch (error: any) {
      throw new BadRequestException(`Verification error: ${error.message}`);
    }
  }
}
