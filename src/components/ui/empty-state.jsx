
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  callToAction,
  compact = false 
}) {
  return (
    <div className={`text-center ${compact ? 'py-8' : 'py-16'}`}>
      {Icon && (
        <Icon className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-muted-foreground opacity-50`} />
      )}
      <h3 className={`${compact ? 'text-lg' : 'text-2xl'} font-semibold text-foreground mb-2`}>
        {title}
      </h3>
      {description && (
        <p className={`text-muted-foreground ${compact ? 'text-sm' : ''} max-w-md mx-auto`}>
          {description}
        </p>
      )}
      {(action || callToAction) && (
        <div className="mt-6">
          {action || callToAction}
        </div>
      )}
    </div>
  );
}