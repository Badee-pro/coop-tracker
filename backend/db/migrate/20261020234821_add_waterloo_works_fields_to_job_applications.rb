class AddWaterlooWorksFieldsToJobApplications < ActiveRecord::Migration[8.1]
  def change
    add_column :job_applications, :external_id, :string
    add_column :job_applications, :term, :string
    add_column :job_applications, :division, :string
    add_column :job_applications, :city, :string
    add_column :job_applications, :openings, :integer
    add_column :job_applications, :job_status, :string
    add_column :job_applications, :source_status, :string
    add_index :job_applications, :external_id, unique: true
  end
end
