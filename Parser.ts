enum TagType {
  Paragraph,
  H1,
  H2,
  H3,
  HorizontalRule,
}

interface IMarkdownDocument {
  Add(...content: string[]): void;
  Get(): string;
}

interface IVisitor {
  Visit(token: ParseElement, markdown_doc: IMarkdownDocument): void;
}

interface IVisitable {
  Accept(
    visitor: IVisitor,
    token: ParseElement,
    markdown_doc: IMarkdownDocument
  ): void;
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
  private readonly tag_type: Map<TagType, string> = new Map<TagType, string>();
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

class MarkdownDocument implements IMarkdownDocument {
  private content: string = "";

  Add(...content: string[]): void {
    content.forEach((e) => {
      this.content += e;
    });
  }

  Get(): string {
    return this.content;
  }
}

class ParseElement {
  current_line: string = "";
}

abstract class VisitorBase implements IVisitor {
  constructor(
    private readonly tag_type: TagType,
    private readonly tag_to_html: TagTypeHTML
  ) {}

  Visit(token: ParseElement, markdown_doc: IMarkdownDocument): void {
    markdown_doc.Add(
      this.tag_to_html.OpeningTag(this.tag_type),
      token.current_line,
      this.tag_to_html.ClosingTag(this.tag_type)
    );
  }
}

class H1Visitor extends VisitorBase {
  constructor() {
    super(TagType.H1, new TagTypeHTML());
  }
}

class H2Visitor extends VisitorBase {
  constructor() {
    super(TagType.H2, new TagTypeHTML());
  }
}

class H3Visitor extends VisitorBase {
  constructor() {
    super(TagType.H3, new TagTypeHTML());
  }
}

class ParagraphVisitor extends VisitorBase {
  constructor() {
    super(TagType.Paragraph, new TagTypeHTML());
  }
}

class HRVisitor extends VisitorBase {
  constructor() {
    super(TagType.HorizontalRule, new TagTypeHTML());
  }
}

class Visitable implements IVisitable {
  Accept(
    visitor: IVisitor,
    token: ParseElement,
    markdown_doc: IMarkdownDocument
  ): void {
    visitor.Visit(token, markdown_doc);
  }
}

abstract class Handler<T> {
  protected next: Handler<T> | null = null;

  public SetNext(next: Handler<T>): void {
    this.next = next;
  }

  public HandleRequest(request: T): void {
    if (!this.CanHandle(request)) {
      if (this.next !== null) {
        this.next.HandleRequest(request);
      }
      return;
    }
  }

  protected abstract CanHandle(request: T): boolean;
}

class LineParser {
  public Parse(value: string, tag: string): [boolean, string] {
    let output: [boolean, string] = [false, ""];

    output[1] = value;

    if (value === "") {
      return output;
    }

    let parse = value.startsWith(`${tag}`);
    if (parse) {
      output[0] = true;
      output[1] = value.substring(tag.length);
    }

    return output;
  }
}

class ParseChainHandler extends Handler<ParseElement> {
  private readonly visitable: IVisitable = new Visitable();

  constructor(
    private readonly document: IMarkdownDocument,
    private readonly tag_type: string,
    private readonly visitor: IVisitor
  ) {
    super();
  }

  protected CanHandle(request: ParseElement): boolean {
    let split = new LineParser().Parse(request.current_line, this.tag_type);

    if (split[0]) {
      request.current_line = split[1];
      this.visitable.Accept(this.visitor, request, this.document);
    }

    return split[0];
  }
}

class ParagraphHandler extends Handler<ParseElement> {
  private readonly visitable: IVisitable = new Visitable();
  private readonly visitor: IVisitor = new ParagraphVisitor();

  constructor(private readonly document: IMarkdownDocument) {
    super();
  }

  protected CanHandle(request: ParseElement): boolean {
    this.visitable.Accept(this.visitor, request, this.document);
    return true;
  }
}

class H1Handler extends ParseChainHandler {
  constructor(document: IMarkdownDocument) {
    super(document, "# ", new H1Visitor());
  }
}

class H2Handler extends ParseChainHandler {
  constructor(document: IMarkdownDocument) {
    super(document, "## ", new H2Visitor());
  }
}

class H3Handler extends ParseChainHandler {
  constructor(document: IMarkdownDocument) {
    super(document, "### ", new H3Visitor());
  }
}

class HRHandler extends ParseChainHandler {
  constructor(document: IMarkdownDocument) {
    super(document, "---", new HRVisitor());
  }
}

class ChainFactory {
  Build(document: IMarkdownDocument): ParseChainHandler {
    let H1: H1Handler = new H1Handler(document);
    let H2: H2Handler = new H2Handler(document);
    let H3: H3Handler = new H3Handler(document);
    let HR: HRHandler = new HRHandler(document);
    //default
    let PG: ParagraphHandler = new ParagraphHandler(document);

    H1.SetNext(H2);
    H2.SetNext(H3);
    H3.SetNext(HR);
    HR.SetNext(PG);

    return H1;
  }
}

class Markdown {
  public ToHTML(text: string): string {
    let document: IMarkdownDocument = new MarkdownDocument();

    let H1: H1Handler = new ChainFactory().Build(document);
    let lines: string[] = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      let parse_el: ParseElement = new ParseElement();

      parse_el.current_line = lines[i];
      H1.HandleRequest(parse_el);
    }
    return document.Get();
  }
}