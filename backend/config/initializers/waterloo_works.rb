Rails.application.config.after_initialize do
  WaterlooWorksSync.start_scheduler if defined?(Rails::Server)
end
