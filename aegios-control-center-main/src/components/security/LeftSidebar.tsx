import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const LeftSidebar = () => {
  return (
    <Card className="h-fit border-cyber-border bg-card glow-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-20 w-20 border-2 border-primary glow-border-strong">
            <AvatarImage src="/placeholder.svg" alt="Organization" />
            <AvatarFallback className="bg-secondary text-primary text-xl">AG</AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Organization</p>
          <p className="text-base font-semibold text-primary glow-text">Aegios Security</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Role</p>
          <p className="text-base font-semibold text-primary glow-text">Security Admin</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeftSidebar;