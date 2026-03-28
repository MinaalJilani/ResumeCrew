import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

const ProfileForm = () => {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleSave = () => {
    toast.success("Profile saved successfully!");
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="bg-secondary border-border" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Job Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Engineer" className="bg-secondary border-border" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Experience Summary</label>
        <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Describe your work experience..." className="bg-secondary border-border min-h-[100px]" />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Skills</label>
        <div className="flex gap-2">
          <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Add a skill..." className="bg-secondary border-border" />
          <Button onClick={addSkill} size="icon" variant="outline" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                {s}
                <button onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:opacity-90">
        <Save className="h-4 w-4 mr-2" /> Save Profile
      </Button>
    </div>
  );
};

export default ProfileForm;
