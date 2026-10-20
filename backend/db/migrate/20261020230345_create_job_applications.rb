class CreateJobApplications < ActiveRecord::Migration[8.1]
  def change
    create_table :job_applications do |t|
      t.string :company, null: false
      t.string :role, null: false
      t.string :status, null: false, default: "wishlist"
      t.string :location
      t.string :job_url
      t.date :applied_on
      t.date :deadline_on
      t.date :next_step_on
      t.text :notes

      t.timestamps
    end
    add_index :job_applications, :status
  end
end
