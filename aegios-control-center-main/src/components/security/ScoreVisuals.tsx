import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSecurityContext } from "@/contexts/SecurityContext";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = {
  Good: '#29A35C', // Primary green
  Low: '#f59e0b', // Softer amber (Tailwind amber-500)
  Critical: '#29A35C' // Changed from red to green
};

const ScoreVisuals = () => {
  const { score, services, isLoading } = useSecurityContext();

  if (isLoading || !score) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-cyber-border bg-card glow-border">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-card glow-border">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = [
    { name: 'Good', value: score.percentages.Good, count: score.counts.Good },
    { name: 'Low', value: score.percentages.Low, count: score.counts.Low },
    { name: 'Critical', value: score.percentages.Critical, count: score.counts.Critical }
  ].filter(item => item.value > 0);

  const barData = [
    { name: 'Low Risk', count: score.counts.Low, percentage: score.percentages.Low },
    { name: 'Critical Risk', count: score.counts.Critical, percentage: score.percentages.Critical }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const status = data.name;
      const servicesInCategory = services.filter(service => service.status === status);
      
      return (
        <div className="bg-card/95 border border-green-500/50 rounded-lg p-3 shadow-md backdrop-blur-sm max-w-xs">
          <p className="text-green-400 font-semibold">{status} Services</p>
          <p className="text-sm text-muted-foreground">
            {data.count} services ({data.value.toFixed(2)}%)
          </p>
          {servicesInCategory.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1">Services:</p>
              {servicesInCategory.map((service, index) => (
                <p key={index} className="text-xs text-foreground">
                  {service.namespace}/{service.name}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-card/95 border border-green-500/50 rounded-lg p-3 shadow-md backdrop-blur-sm">
        <p className="text-green-400 font-semibold">{data.name}</p>
        <p className="text-sm text-foreground">Count: {data.count}</p>
        <p className="text-sm text-muted-foreground">Percentage: {data.percentage.toFixed(2)}%</p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card className="border-cyber-border bg-card hover:border-green-500/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-green-muted">Security Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 40 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={{
                  stroke: 'hsl(var(--muted-foreground))',
                  strokeWidth: 1
                }}
                label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card className="border-cyber-border bg-card hover:border-green-500/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-green-muted">Risk Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--cyber-border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                content={<CustomBarTooltip />}
                cursor={false}
                wrapperStyle={{ outline: 'none' }}
              />
              <Bar 
                dataKey="count" 
                fill="#29A35C"
                radius={[4, 4, 0, 0]}
                activeBar={{
                  stroke: '#29A35C',
                  strokeWidth: 2,
                  fill: '#29A35C'
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreVisuals;