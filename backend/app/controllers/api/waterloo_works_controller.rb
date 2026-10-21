module Api
  class WaterlooWorksController < ApplicationController
    def status
      render json: WaterlooWorksSync.status
    end

    def sync
      render json: WaterlooWorksSync.run
    end
  end
end
