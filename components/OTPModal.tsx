"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { sendEmailOTP, verifyEmailOTP } from "@/lib/actions/user.actions";

interface Props {
  sessionUserId: string;
  email: string;
}

const INTERVAL_SECONDS = 60;

const OTPModal = ({ sessionUserId, email }: Props) => {
  const [open, setOpen] = useState(true);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [timerSec, setTimerSec] = useState(INTERVAL_SECONDS);
  const [errorMessage, setErrorMessage] = useState("");

  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  const timerFormat = useMemo(() => {
    const minute = Math.floor(timerSec / 60);
    const second = timerSec - minute * 60;

    return `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
  }, [timerSec]);

  useEffect(() => {
    startResendTimer();
    return () => stopResendTimer();
  }, []);

  useEffect(() => {
    if (timerSec === 0 && interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    } else if (timerSec === INTERVAL_SECONDS) startResendTimer();
  }, [timerSec]);

  const startResendTimer = () => {
    if (interval.current) clearInterval(interval.current);

    setTimerSec(INTERVAL_SECONDS);

    interval.current = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval.current!);
          interval.current = null;
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const stopResendTimer = () => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  };

  const resendOtp = async () => {
    setOtpSending(true);
    setErrorMessage("");
    setOtp("");

    try {
      await sendEmailOTP(email);
      startResendTimer();
    } catch {
      setErrorMessage("Failed to send email OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const session = await verifyEmailOTP({ sessionUserId, otp });
      if (session?.sessionId) router.push("/");
    } catch {
      setErrorMessage("Failed to verify otp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader className="relative flex justify-center">
          <AlertDialogTitle className="h2 text-center">
            Enter Your OTP
            <Image
              src="/assets/icons/close-dark.svg"
              alt="close"
              width={20}
              height={20}
              onClick={() => setOpen(false)}
              className="otp-close-button"
            />
          </AlertDialogTitle>
          <AlertDialogDescription className="subtitle-2 text-center text-light-100">
            We have sent a code to
            <span className="pl-1 text-brand">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup className="shad-otp">
            <InputOTPSlot index={0} className="shad-otp-slot" />
            <InputOTPSlot index={1} className="shad-otp-slot" />
            <InputOTPSlot index={2} className="shad-otp-slot" />
            <InputOTPSlot index={3} className="shad-otp-slot" />
            <InputOTPSlot index={4} className="shad-otp-slot" />
            <InputOTPSlot index={5} className="shad-otp-slot" />
          </InputOTPGroup>
        </InputOTP>
        <AlertDialogFooter>
          <div className="flex w-full flex-col gap-4">
            <AlertDialogAction
              disabled={otp.length !== 6 || loading}
              onClick={handleSubmit}
              className="shad-submit-btn h-12"
            >
              Submit
              {loading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  height={24}
                  width={24}
                  className="ml-2 animate-spin"
                />
              )}
            </AlertDialogAction>
            <div className="subtitle-2 mt-2 text-center text-light-100">
              <p className="text-center text-xs font-medium">
                {timerSec > 0 && <span>{timerFormat}</span>}
              </p>
              <div>
                Didn&apos;t get a code ?
                <Button
                  type="button"
                  variant="link"
                  className="pl-1 text-brand"
                  disabled={otpSending || timerSec > 0}
                  onClick={resendOtp}
                >
                  Click to resend
                </Button>
              </div>
              {errorMessage && (
                <p className="error-message mt-2">* {errorMessage}</p>
              )}
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OTPModal;
