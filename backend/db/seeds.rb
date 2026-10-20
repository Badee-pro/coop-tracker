return if JobApplication.exists?

[
  { company: "Shopify", role: "Software Developer Intern", status: "applied", location: "Remote", applied_on: Date.today - 10, next_step_on: Date.today + 4 },
  { company: "RBC", role: "Data Analyst Co-op", status: "interviewing", location: "Toronto, ON", applied_on: Date.today - 20, next_step_on: Date.today + 2, notes: "Technical interview with the analytics team." },
  { company: "Ubisoft", role: "Gameplay Programmer Co-op", status: "wishlist", location: "Montreal, QC", deadline_on: Date.today + 14 },
  { company: "Wealthsimple", role: "Backend Engineering Co-op", status: "offer", location: "Toronto, ON", applied_on: Date.today - 35 },
  { company: "Amazon", role: "SDE Co-op", status: "rejected", location: "Vancouver, BC", applied_on: Date.today - 40 }
].each { |attrs| JobApplication.create!(attrs) }
