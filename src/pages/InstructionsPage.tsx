import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  List,
  BarChart2,
  TrendingUp,
  Landmark,
  Upload,
  Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface InstructionCard {
  step: number;
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

const instructionCards: InstructionCard[] = [
  {
    step: 1,
    title: 'Configurar listas maestras',
    description:
      'Administra las categorías, conceptos, monedas y demás catálogos que se usan en los formularios de la aplicación.',
    path: '/catalogos',
    icon: List,
  },
  {
    step: 2,
    title: 'Registrar ingresos y egresos',
    description:
      'Registra tus transacciones diarias indicando tipo, categoría, concepto y monto para mantener un control detallado de tus finanzas.',
    path: '/ingreso',
    icon: PlusCircle,
  },
  {
    step: 3,
    title: 'Revisar dashboard',
    description:
      'Visualiza un resumen de tus finanzas con KPIs, gráficas de distribución de gastos y comparativos de ingresos vs egresos.',
    path: '/dashboard',
    icon: BarChart2,
  },
  {
    step: 4,
    title: 'Revisar flujo de caja',
    description:
      'Consulta el flujo de caja mensual y acumulado del año para identificar tendencias y planificar tus finanzas.',
    path: '/flujo-caja',
    icon: TrendingUp,
  },
  {
    step: 5,
    title: 'Cuadrar caja y bancos',
    description:
      'Concilia tu flujo acumulado con los saldos reales de tus cuentas bancarias y billeteras para verificar que todo cuadre.',
    path: '/caja-bancos',
    icon: Landmark,
  },
  {
    step: 6,
    title: 'Importar datos',
    description:
      'Carga información histórica desde archivos CSV o Excel para iniciar con un historial financiero completo.',
    path: '/datos',
    icon: Upload,
  },
  {
    step: 7,
    title: 'Exportar datos',
    description:
      'Descarga tus registros financieros en formato CSV para tener un respaldo externo o compartir tu información.',
    path: '/datos',
    icon: Download,
  },
];

export default function InstructionsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenido a Finanzas Personales</h1>
        <p className="text-muted-foreground mt-1">
          Sigue estos pasos para empezar a usar la aplicación y gestionar tus finanzas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {instructionCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.step}
              onClick={() => navigate(card.path)}
              className="flex flex-col items-start gap-3 rounded-lg border bg-card p-5 text-left shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex w-full items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {card.step}
                </span>
                <Icon className="size-5 shrink-0 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold leading-tight">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
