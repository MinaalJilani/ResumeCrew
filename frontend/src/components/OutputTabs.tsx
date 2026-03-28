import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PenTool, Target } from "lucide-react";

const sampleResume = `# John Doe
**Software Engineer** | john@email.com | (555) 123-4567

## Summary
Experienced software engineer with 5+ years in full-stack development, specializing in React, TypeScript, and cloud technologies.

## Experience
**Senior Developer** — TechCorp Inc. (2021–Present)
- Led migration of legacy systems to modern React architecture
- Reduced load times by 40% through performance optimization
- Mentored team of 4 junior developers

## Skills
React, TypeScript, Node.js, Python, AWS, PostgreSQL, Docker`;

const sampleCover = `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at your company. With over 5 years of experience in full-stack development and a passion for building scalable, user-centric applications, I am confident in my ability to contribute effectively to your team.

In my current role at TechCorp, I have led the migration of legacy systems to a modern React-based architecture, resulting in a 40% improvement in load times. I thrive in collaborative environments and have a track record of mentoring junior developers.

I would welcome the opportunity to discuss how my skills align with your team's needs.

Best regards,
John Doe`;

const sampleInterview = `## 🎯 Likely Interview Questions

1. **Tell me about a challenging project you led.**
   - Focus on the legacy migration, quantify results (40% faster)

2. **How do you handle disagreements with team members?**
   - Emphasize collaborative problem-solving

3. **Describe your experience with CI/CD pipelines.**
   - Discuss Docker, GitHub Actions, deployment automation

4. **What's your approach to code reviews?**
   - Constructive feedback, knowledge sharing, maintaining standards

## 💡 Tips
- Research the company's recent product launches
- Prepare 3 thoughtful questions to ask the interviewer
- Review system design fundamentals`;

const OutputTabs = () => {
  return (
    <Tabs defaultValue="resume" className="w-full">
      <TabsList className="w-full bg-secondary border border-border">
        <TabsTrigger value="resume" className="flex-1 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <FileText className="h-3.5 w-3.5" /> Resume
        </TabsTrigger>
        <TabsTrigger value="cover" className="flex-1 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <PenTool className="h-3.5 w-3.5" /> Cover Letter
        </TabsTrigger>
        <TabsTrigger value="interview" className="flex-1 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
          <Target className="h-3.5 w-3.5" /> Interview Prep
        </TabsTrigger>
      </TabsList>

      {[
        { value: "resume", content: sampleResume },
        { value: "cover", content: sampleCover },
        { value: "interview", content: sampleInterview },
      ].map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4 bg-card border border-border rounded-xl p-6">
          <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-body">{tab.content}</pre>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default OutputTabs;
