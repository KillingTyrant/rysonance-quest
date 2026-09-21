import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export function SignUpSuccess({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-5xl font-bold">Controlla la tua email</CardTitle>
          <CardDescription className="text-xl">
            Ti abbiamo inviato un link per confermare l&apos;account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">
              Apri il link nell&apos;email per attivare l&apos;account: ti porterà
              direttamente alla creazione del tuo eroe. Se non la trovi, controlla
              anche la cartella spam.
            </p>
            <Button asChild variant="ticket" className="w-full">
              <Link href="/auth/login">Accedi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
