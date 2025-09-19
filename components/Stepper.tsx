import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEPS } from '@/types';

interface StepperProps {
  currentStep: number;
  skipStep3?: boolean;
}

export function Stepper({ currentStep, skipStep3 = false }: StepperProps) {
  const visibleSteps = skipStep3 ? STEPS.filter(step => step.id !== 3) : STEPS;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === visibleSteps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                    isCompleted
                      ? 'bg-success-500 text-white'
                      : isCurrent
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Info */}
                <div className="ml-4">
                  <div
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isCompleted || isCurrent
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      'text-xs transition-colors',
                      isCompleted || isCurrent
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-6">
                  <div
                    className={cn(
                      'h-0.5 transition-colors duration-300',
                      isCompleted
                        ? 'bg-success-500'
                        : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
