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
    <div className="w-full max-w-6xl mx-auto mb-8">
      {/* Desktop: Horizontal Stepper */}
      <div className="hidden lg:flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === visibleSteps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
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
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isCompleted || isCurrent
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      'text-xs transition-colors hidden xl:block',
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
                <div className="flex-1 mx-2 mb-8">
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

      {/* Mobile/Tablet: Compact Stepper */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Step {currentStep} of {visibleSteps.length}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {visibleSteps.find(s => s.id === currentStep)?.title}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / visibleSteps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
