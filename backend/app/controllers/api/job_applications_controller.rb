module Api
  class JobApplicationsController < ApplicationController
    before_action :set_job_application, only: %i[show update destroy]

    def index
      render json: JobApplication.ordered
    end

    def show
      render json: @job_application
    end

    def create
      job_application = JobApplication.new(job_application_params)
      if job_application.save
        render json: job_application, status: :created
      else
        render json: { errors: job_application.errors.full_messages }, status: :unprocessable_content
      end
    end

    def update
      attrs = @job_application.synced? ? job_application_params.slice(:notes) : job_application_params
      if @job_application.update(attrs)
        render json: @job_application
      else
        render json: { errors: @job_application.errors.full_messages }, status: :unprocessable_content
      end
    end

    def destroy
      @job_application.destroy
      head :no_content
    end

    def stats
      counts = JobApplication.group(:status).count
      render json: JobApplication::STATUSES.index_with { |s| counts.fetch(s, 0) }
    end

    private

    def set_job_application
      @job_application = JobApplication.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { errors: ["Not found"] }, status: :not_found
    end

    def job_application_params
      params.require(:job_application).permit(
        :company, :role, :status, :location, :job_url,
        :applied_on, :deadline_on, :next_step_on, :notes,
        :external_id, :term, :division, :city, :openings, :job_status
      )
    end
  end
end
