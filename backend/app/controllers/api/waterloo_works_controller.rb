module Api
  class WaterlooWorksController < ApplicationController
    def status
      render json: WaterlooWorksSync.status
    end

    def import_items
      items = JSON.parse(request.raw_post).fetch("items")
      return head :unprocessable_content unless items.is_a?(Array)

      render json: WaterlooWorksSync.import_items(items)
    rescue JSON::ParserError, KeyError
      head :bad_request
    end
  end
end
