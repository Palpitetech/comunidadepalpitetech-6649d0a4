-- Create help_content table
CREATE TABLE public.help_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    meta_description TEXT,
    main_question TEXT,
    direct_answer TEXT,
    content TEXT NOT NULL,
    faq_items JSONB DEFAULT '[]'::jsonb,
    author_name TEXT DEFAULT 'Equipe de Suporte',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Help content is viewable by everyone" 
ON public.help_content 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_help_content_updated_at
BEFORE UPDATE ON public.help_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on slug
CREATE INDEX idx_help_content_slug ON public.help_content(slug);