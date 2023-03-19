enum TagType {
    Paragraph,
    H1,
    H2,
    H3,
    HorizontalRule,
}

class HtmlHandler {
    public TextChangeHandler(id: string, output: string): void {
        let markdown = <HTMLTextAreaElement>document.getElementById(id);
        let markdown_output = <HTMLLabelElement>document.getElementById(output);

        if (markdown !== null) {
            markdown.onkeyup = (e) => {
                markdown_output.innerHTML = markdown.value;
            };
        } else {
            markdown_output.innerHTML = "<p></p>";
        }
    }
}

class TagTypeHTML {
    private readonly tag_type: Map<TagType, string> = new Map<
        TagType,
        string
    >();
    constructor() {
        this.tag_type.set(TagType.H1, "h1");
        this.tag_type.set(TagType.H2, "h2");
        this.tag_type.set(TagType.H3, "h3");
        this.tag_type.set(TagType.Paragraph, "p");
        this.tag_type.set(TagType.HorizontalRule, "hr");
    }

    private GetTag(tag_type: TagType, tag_pattern: string): string {
        let tag = this.tag_type.get(tag_type);
        if (tag !== null) {
            return `${tag_pattern}${tag}>`;
        }
        return `${tag_pattern}p>`;
    }

    public OpeningTag(tag_type: TagType): string {
        return this.GetTag(tag_type, `<`);
    }

    public ClosingTag(tag_type: TagType): string {
        return this.GetTag(tag_type, `</`);
    }
}
