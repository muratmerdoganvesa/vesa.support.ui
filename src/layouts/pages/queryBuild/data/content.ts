import { Field } from "react-querybuilder";

export const content = [
    {
      title: "Sorgu Oluşturma Bilgileri",
      text: [
        "Bu bölüm, sorgu oluşturma sürecini daha iyi anlamanıza yardımcı olmak amacıyla hazırlanmıştır. Burada, React QueryBuilder aracını kullanarak veri sorguları oluşturma adımlarını öğreneceksiniz.",
        "React QueryBuilder, kullanıcıların görsel bir arayüz aracılığıyla sorgu oluşturmalarını sağlayan etkileşimli bir araçtır. Teknik bilgi gerektirmeden, veri tabanı sorguları veya API talepleri hazırlamanıza olanak tanır. Kullanıcı dostu arayüzü sayesinde sorgularınızı hızlı ve verimli bir şekilde oluşturabilirsiniz.",
        "QueryBuilder, genellikle aşağıdaki temel bileşenlerden oluşur. Bu bileşenlerle sorgularınızı özelleştirebilirsiniz:"
      ],
    },
    {
      title: "Sorgu Oluşturma Adımları",
      text: [
        "1. <strong>Kriter Seçimi:</strong> İlk adımda, sorguya dahil etmek istediğiniz kriterleri seçmeniz gerekecektir. Bu kriterler, sorguyu oluştururken hangi veri alanlarını ve filtreleri kullanacağınızı belirler. İhtiyacınıza göre, veri tipini ve özelliklerini seçebilirsiniz.",
        "2. <strong>Koşullar Belirleme:</strong> Seçtiğiniz kriterlere uygun koşullar ekleyebilirsiniz. Örneğin, 'Eşittir', 'Büyüktür' veya 'İçerir' gibi koşulları seçerek sorgunuzu daha da özelleştirebilirsiniz.",
        "3. <strong>Değer Girişi:</strong> Belirlediğiniz koşullara göre, her bir kriter için uygun veri değerlerini girmeniz gerekecek. Bu adım, sorgunuzu daha hassas hale getirir ve yalnızca aradığınız verilere ulaşmanıza yardımcı olur."
      ],
    },
    {
      title: "Ekstra Özellikler ve İpuçları",
      text: [
        "<strong>Bağlantılar ve Mantıksal Operatörler:</strong> Birden fazla kriter eklediğinizde, bu kriterler arasında mantıksal bağlantılar (AND, OR) kullanarak sorgunuzu daha esnek hale getirebilirsiniz. Örneğin, 'A ve B' ya da 'A veya B' gibi bağlantılar kurarak karmaşık sorgular oluşturabilirsiniz. Bu sayede verilerinizi daha detaylı bir şekilde filtreleyebilirsiniz."
      ],
    },
  ];
  

  export  const fields: Field[] = [
    {
      name: "ticketId",
      label: "Ticket ID",
      inputType: "text",
      validator: (value: any) => /^[A-Z]{2,3}-\d{3,6}$/.test(value?.toString() || ""),
      placeholder: "e.g., TK-12345",
      description: "Format: XX-12345 (2-3 letters followed by 3-6 digits)",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "beginsWith", label: "Begins with" },
        { name: "endsWith", label: "Ends with" },
        { name: "contains", label: "Contains" }
      ]
    },
    {
      name: "title",
      label: "Ticket Title",
      inputType: "text",
      validator: (value: any) => value?.toString().length >= 5,
      placeholder: "Enter ticket title...",
      description: "Minimum 5 characters required",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "contains", label: "Contains" },
        { name: "beginsWith", label: "Begins with" },
        { name: "endsWith", label: "Ends with" },
        { name: "null", label: "Is empty" },
        { name: "notNull", label: "Is not empty" }
      ]
    },
    {
      name: "status",
      label: "Status",
      valueEditorType: "select",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "in", label: "Is any of" },
        { name: "notIn", label: "Is none of" }
      ],
      values: [
        { name: "new", label: "New" },
        { name: "open", label: "Open" },
        { name: "inProgress", label: "In Progress" },
        { name: "pendingInfo", label: "Pending Info" },
        { name: "resolved", label: "Resolved" },
        { name: "closed", label: "Closed" },
        { name: "cancelled", label: "Cancelled" }
      ],
      description: "Current ticket status"
    },
    {
      name: "priority",
      label: "Priority",
      valueEditorType: "select",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "in", label: "Is any of" }
      ],
      values: [
        { name: "critical", label: "Critical (P0)" },
        { name: "high", label: "High (P1)" },
        { name: "medium", label: "Medium (P2)" },
        { name: "low", label: "Low (P3)" },
        { name: "trivial", label: "Trivial (P4)" }
      ],
      description: "Ticket priority level"
    },
    {
      name: "category",
      label: "Category",
      valueEditorType: "select",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "in", label: "Is any of" }
      ],
      values: [
        { name: "technical", label: "Technical Issue" },
        { name: "functional", label: "Functional Requirement" },
        { name: "userAccess", label: "User Access" },
        { name: "dataIssue", label: "Data Issue" },
        { name: "security", label: "Security" },
        { name: "performance", label: "Performance" },
        { name: "documentation", label: "Documentation" }
      ],
      description: "Ticket category"
    },
    {
      name: "assignee",
      label: "Assigned To",
      valueEditorType: "select",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "in", label: "Is any of" },
        { name: "null", label: "Is unassigned" },
        { name: "notNull", label: "Is assigned" }
      ],
      values: [
        { name: "user_1", label: "John Doe (Developer)" },
        { name: "user_2", label: "Sarah Johnson (QA)" },
        { name: "user_3", label: "Mike Chen (DevOps)" },
        { name: "user_4", label: "Anna Smith (Product)" },
        { name: "user_5", label: "David Kim (Support)" }
      ],
      description: "Person assigned to the ticket"
    },
    {
      name: "createdDate",
      label: "Created Date",
      inputType: "date",
      operators: [
        { name: "=", label: "On" },
        { name: "!=", label: "Not on" },
        { name: ">", label: "After" },
        { name: "<", label: "Before" },
        { name: "between", label: "Between" },
        { name: "last7Days", label: "Last 7 days" },
        { name: "last30Days", label: "Last 30 days" },
        { name: "currentMonth", label: "Current month" }
      ],
      description: "Date when the ticket was created"
    },
    {
      name: "dueDate",
      label: "Due Date",
      inputType: "date",
      operators: [
        { name: "=", label: "On" },
        { name: ">", label: "After" },
        { name: "<", label: "Before" },
        { name: "between", label: "Between" },
        { name: "null", label: "Not set" },
        { name: "notNull", label: "Is set" },
        { name: "tomorrow", label: "Due tomorrow" },
        { name: "today", label: "Due today" },
        { name: "next7Days", label: "Due in next 7 days" }
      ],
      description: "When the ticket is due to be completed"
    },
    {
      name: "lastUpdated",
      label: "Last Updated",
      inputType: "datetime-local",
      operators: [
        { name: ">", label: "After" },
        { name: "<", label: "Before" },
        { name: "between", label: "Between" },
        { name: "lastHour", label: "In the last hour" },
        { name: "last24Hours", label: "In the last 24 hours" },
        { name: "last7Days", label: "In the last 7 days" }
      ],
      description: "When the ticket was last updated"
    },
    {
      name: "tags",
      label: "Tags",
      valueEditorType: "multiselect",
      operators: [
        { name: "contains", label: "Contains" },
        { name: "doesNotContain", label: "Does not contain" },
        { name: "containsAll", label: "Contains all" },
        { name: "containsNone", label: "Contains none" }
      ],
      values: [
        { name: "frontend", label: "Frontend" },
        { name: "backend", label: "Backend" },
        { name: "database", label: "Database" },
        { name: "api", label: "API" },
        { name: "security", label: "Security" },
        { name: "urgent", label: "Urgent" },
        { name: "bug", label: "Bug" },
        { name: "feature", label: "Feature" },
        { name: "enhancement", label: "Enhancement" },
        { name: "documentation", label: "Documentation" }
      ],
      description: "Tags associated with the ticket"
    },
    {
      name: "department",
      label: "Department",
      valueEditorType: "select",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "in", label: "Is any of" }
      ],
      values: [
        { name: "engineering", label: "Engineering" },
        { name: "product", label: "Product" },
        { name: "marketing", label: "Marketing" },
        { name: "sales", label: "Sales" },
        { name: "support", label: "Customer Support" },
        { name: "finance", label: "Finance" },
        { name: "hr", label: "Human Resources" }
      ],
      description: "Department responsible for the ticket"
    },
    {
      name: "reportedBy",
      label: "Reported By",
      inputType: "text",
      operators: [
        { name: "=", label: "Is" },
        { name: "!=", label: "Is not" },
        { name: "contains", label: "Contains" },
        { name: "beginsWith", label: "Begins with" }
      ],
      placeholder: "Enter name or email...",
      description: "Person who reported the issue"
    },
    {
      name: "timeSpent",
      label: "Time Spent (hours)",
      inputType: "number",
      operators: [
        { name: "=", label: "Equals" },
        { name: ">", label: "Greater than" },
        { name: "<", label: "Less than" },
        { name: "between", label: "Between" }
      ],
      validator: (value: any) => !isNaN(value) && Number(value) >= 0,
      placeholder: "e.g., 4.5",
      description: "Hours spent working on the ticket"
    }
  ];

export const operators = [
    { name: "=", label: "Equal to" },
    { name: "!=", label: "Not equal to" },
    { name: "<", label: "Less than" },
    { name: ">", label: "Greater than" },
    { name: "<=", label: "Less than or equal to" },
    { name: ">=", label: "Greater than or equal to" },
    { name: "contains", label: "Contains" },
    { name: "beginsWith", label: "Begins with" },
    { name: "endsWith", label: "Ends with" },
    { name: "in", label: "In" },
    { name: "notIn", label: "Not in" },
  ];