Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :job_applications do
      get :stats, on: :collection
    end
  end
end
