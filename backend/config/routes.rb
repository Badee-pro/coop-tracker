Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "waterloo_works/status", to: "waterloo_works#status"
    post "waterloo_works/sync", to: "waterloo_works#sync"

    resources :job_applications do
      get :stats, on: :collection
      post :import, on: :collection
    end
  end
end
