export interface OrgNode {
  id: string;
  name: string;
  title?: string;
  email?: string;
  photo?: string;
  children?: OrgNode[];
  expanded?: boolean;
  type?: string;
  className?: string;
}

// export const mockData: OrgNode[] = [
//   {
//     id: "99",
//     name: "Amy Elsner",
//     title: "CEO",
//     email: "amy.elsner@vesa.com",
//     photo: "https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png",
//     expanded: true,
//     className: "ceo-node",
//     children: [
//       {
//         id: "82",
//         name: "Anna Fali",
//         title: "CMO",
//         email: "anna.fali@vesa.com",
//         photo: "https://primefaces.org/cdn/primereact/images/avatar/annafali.png",
//         expanded: true,
//         className: "executive-node",
//         children: [
//           {
//             id: "4",
//             name: "Sales",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "8",
//                 name: "Robert Johnson",
//                 title: "Global Sales Director",
//                 email: "robert.johnson@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/ionibowcher.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "9",
//                     name: "North America Sales",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "10",
//                         name: "Mary Williams",
//                         title: "NA Sales Manager",
//                         email: "mary.williams@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                         expanded: true,
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "11",
//                             name: "Carlos Rodriguez",
//                             title: "Senior Sales Rep",
//                             email: "carlos.rodriguez@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "12",
//                             name: "Jessica Parker",
//                             title: "Sales Rep",
//                             email: "jessica.parker@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "13",
//                             name: "Kevin Smith",
//                             title: "Sales Rep",
//                             email: "kevin.smith@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "14",
//                     name: "EMEA Sales",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "15",
//                         name: "Pierre Dupont",
//                         title: "EMEA Sales Manager",
//                         email: "pierre.dupont@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/xuxuefeng.png",
//                         expanded: true,
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "16",
//                             name: "Luisa Bianchi",
//                             title: "Senior Sales Rep",
//                             email: "luisa.bianchi@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/elwinsharvill.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "17",
//                             name: "Hans Müller",
//                             title: "Sales Rep",
//                             email: "hans.mueller@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "18",
//                     name: "APAC Sales",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "19",
//                         name: "Wei Chen",
//                         title: "APAC Sales Manager",
//                         email: "wei.chen@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/asiyajavayant.png",
//                         expanded: true,
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "20",
//                             name: "Akira Tanaka",
//                             title: "Senior Sales Rep",
//                             email: "akira.tanaka@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/lisaandrew.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "21",
//                             name: "Priya Sharma",
//                             title: "Sales Rep",
//                             email: "priya.sharma@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             id: "22",
//             name: "Marketing",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "23",
//                 name: "James Wilson",
//                 title: "Marketing Director",
//                 email: "james.wilson@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/xuxuefeng.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "24",
//                     name: "Digital Marketing",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "25",
//                         name: "Sophia Kim",
//                         title: "Digital Marketing Manager",
//                         email: "sophia.kim@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "26",
//                             name: "Marcus Johnson",
//                             title: "SEO Specialist",
//                             email: "marcus.johnson@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ionibowcher.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "27",
//                             name: "Elena Martinez",
//                             title: "Social Media Specialist",
//                             email: "elena.martinez@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "28",
//                     name: "Brand Management",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "29",
//                         name: "Oliver Scott",
//                         title: "Brand Manager",
//                         email: "oliver.scott@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "30",
//                             name: "Zoe Taylor",
//                             title: "Graphic Designer",
//                             email: "zoe.taylor@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/elwinsharvill.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "31",
//                             name: "Daniel Garcia",
//                             title: "Content Creator",
//                             email: "daniel.garcia@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       {
//         id: "32",
//         name: "Stephen Shaw",
//         title: "CTO",
//         email: "stephen.shaw@vesa.com",
//         photo: "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//         expanded: true,
//         className: "executive-node",
//         children: [
//           {
//             id: "33",
//             name: "Engineering",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "34",
//                 name: "David Lee",
//                 title: "VP of Engineering",
//                 email: "david.lee@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "35",
//                     name: "Frontend Development",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "36",
//                         name: "Emma Wilson",
//                         title: "Frontend Lead",
//                         email: "emma.wilson@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "37",
//                             name: "Noah Martinez",
//                             title: "Senior Frontend Developer",
//                             email: "noah.martinez@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "38",
//                             name: "Sofia Rodriguez",
//                             title: "Frontend Developer",
//                             email: "sofia.rodriguez@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "39",
//                             name: "Jackson Lee",
//                             title: "Frontend Developer",
//                             email: "jackson.lee@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ionibowcher.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "40",
//                     name: "Backend Development",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "41",
//                         name: "Lisa Garcia",
//                         title: "Backend Lead",
//                         email: "lisa.garcia@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/lisaandrew.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "42",
//                             name: "Aiden Wang",
//                             title: "Senior Backend Developer",
//                             email: "aiden.wang@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "43",
//                             name: "Olivia Brown",
//                             title: "Backend Developer",
//                             email: "olivia.brown@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/elwinsharvill.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "44",
//                             name: "Lucas Kim",
//                             title: "Backend Developer",
//                             email: "lucas.kim@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "45",
//                     name: "DevOps",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "46",
//                         name: "Ryan Chen",
//                         title: "DevOps Lead",
//                         email: "ryan.chen@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/xuxuefeng.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "47",
//                             name: "Isabella Silva",
//                             title: "DevOps Engineer",
//                             email: "isabella.silva@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "48",
//                             name: "Ethan Davis",
//                             title: "DevOps Engineer",
//                             email: "ethan.davis@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ionibowcher.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             id: "49",
//             name: "Product & Design",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "50",
//                 name: "Michael Brown",
//                 title: "VP of Product",
//                 email: "michael.brown@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/asiyajavayant.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "51",
//                     name: "Product Management",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "52",
//                         name: "Rachel Green",
//                         title: "Product Manager",
//                         email: "rachel.green@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "53",
//                             name: "Jacob Wilson",
//                             title: "Associate Product Manager",
//                             email: "jacob.wilson@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ionibowcher.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "54",
//                     name: "UX/UI Design",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "55",
//                         name: "Sophia Zhang",
//                         title: "Design Lead",
//                         email: "sophia.zhang@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "56",
//                             name: "Benjamin Moore",
//                             title: "UX Designer",
//                             email: "benjamin.moore@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "57",
//                             name: "Mia Johnson",
//                             title: "UI Designer",
//                             email: "mia.johnson@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/elwinsharvill.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             id: "58",
//             name: "Data & Analytics",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "59",
//                 name: "Samantha Wu",
//                 title: "Data Science Director",
//                 email: "samantha.wu@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "60",
//                     name: "Data Engineering",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "61",
//                         name: "Alexander Kim",
//                         title: "Data Engineering Lead",
//                         email: "alexander.kim@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "62",
//                             name: "Grace Lee",
//                             title: "Data Engineer",
//                             email: "grace.lee@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "63",
//                             name: "William Chen",
//                             title: "Data Engineer",
//                             email: "william.chen@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "64",
//                     name: "Data Science",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "65",
//                         name: "Victoria Thompson",
//                         title: "Lead Data Scientist",
//                         email: "victoria.thompson@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/elwinsharvill.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "66",
//                             name: "Nathan Park",
//                             title: "Data Scientist",
//                             email: "nathan.park@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "67",
//                             name: "Hannah Garcia",
//                             title: "Data Analyst",
//                             email: "hannah.garcia@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       {
//         id: "68",
//         name: "Emily Davis",
//         title: "CFO",
//         email: "emily.davis@vesa.com",
//         photo: "https://primefaces.org/cdn/primereact/images/avatar/elwinsharvill.png",
//         expanded: true,
//         className: "executive-node",
//         children: [
//           {
//             id: "69",
//             name: "Finance",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "70",
//                 name: "Andrew Wilson",
//                 title: "Finance Director",
//                 email: "andrew.wilson@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "71",
//                     name: "Financial Planning",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "72",
//                         name: "Sarah Chen",
//                         title: "FP&A Manager",
//                         email: "sarah.chen@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                         expanded: true,
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "73",
//                             name: "Daniel Lopez",
//                             title: "Financial Analyst",
//                             email: "daniel.lopez@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "74",
//                             name: "Julia Kim",
//                             title: "Financial Analyst",
//                             email: "julia.kim@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "75",
//                     name: "Treasury",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "76",
//                         name: "Robert Chang",
//                         title: "Treasury Manager",
//                         email: "robert.chang@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "77",
//                             name: "Emily Wang",
//                             title: "Treasury Analyst",
//                             email: "emily.wang@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             id: "78",
//             name: "Accounting",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "79",
//                 name: "Thomas Moore",
//                 title: "Controller",
//                 email: "thomas.moore@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "80",
//                     name: "Accounts Payable",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "81",
//                         name: "Jennifer Zhang",
//                         title: "AP Manager",
//                         email: "jennifer.zhang@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "82",
//                             name: "Christopher Lee",
//                             title: "AP Specialist",
//                             email: "christopher.lee@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ionibowcher.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "83",
//                     name: "Accounts Receivable",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "84",
//                         name: "Michael Smith",
//                         title: "AR Manager",
//                         email: "michael.smith@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "85",
//                             name: "Ashley Johnson",
//                             title: "AR Specialist",
//                             email: "ashley.johnson@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       {
//         id: "86",
//         name: "Rebecca Martin",
//         title: "CHRO",
//         email: "rebecca.martin@vesa.com",
//         photo: "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//         expanded: true,
//         className: "executive-node",
//         children: [
//           {
//             id: "87",
//             name: "Human Resources",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "88",
//                 name: "Jonathan Taylor",
//                 title: "HR Director",
//                 email: "jonathan.taylor@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "89",
//                     name: "Recruiting",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "90",
//                         name: "Michelle Park",
//                         title: "Talent Acquisition Manager",
//                         email: "michelle.park@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "91",
//                             name: "Brian Lewis",
//                             title: "Technical Recruiter",
//                             email: "brian.lewis@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                             className: "employee-node",
//                           },
//                           {
//                             id: "92",
//                             name: "Stephanie Clark",
//                             title: "HR Recruiter",
//                             email: "stephanie.clark@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "93",
//                     name: "Employee Relations",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "94",
//                         name: "David Rodriguez",
//                         title: "Employee Relations Manager",
//                         email: "david.rodriguez@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "95",
//                             name: "Amanda Johnson",
//                             title: "HR Specialist",
//                             email: "amanda.johnson@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             id: "96",
//             name: "Administration",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "97",
//                 name: "Katherine White",
//                 title: "Administrative Director",
//                 email: "katherine.white@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/lisaandrew.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "98",
//                     name: "Facilities Management",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "99",
//                         name: "Richard Brown",
//                         title: "Facilities Manager",
//                         email: "richard.brown@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "100",
//                             name: "Sandra Martinez",
//                             title: "Facilities Coordinator",
//                             email: "sandra.martinez@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//       {
//         id: "101",
//         name: "Charles Thompson",
//         title: "General Counsel",
//         email: "charles.thompson@vesa.com",
//         photo: "https://primefaces.org/cdn/primereact/images/avatar/stephenshaw.png",
//         expanded: true,
//         className: "executive-node",
//         children: [
//           {
//             id: "102",
//             name: "Legal",
//             expanded: true,
//             type: "department",
//             children: [
//               {
//                 id: "103",
//                 name: "Patricia Evans",
//                 title: "Legal Director",
//                 email: "patricia.evans@vesa.com",
//                 photo: "https://primefaces.org/cdn/primereact/images/avatar/lisaandrew.png",
//                 expanded: true,
//                 className: "manager-node",
//                 children: [
//                   {
//                     id: "104",
//                     name: "Corporate Law",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "105",
//                         name: "Robert Miller",
//                         title: "Corporate Counsel",
//                         email: "robert.miller@vesa.com",
//                         photo:
//                           "https://primefaces.org/cdn/primereact/images/avatar/ivanmagalhaes.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "106",
//                             name: "Laura Wilson",
//                             title: "Associate Counsel",
//                             email: "laura.wilson@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/sarahbell.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                   {
//                     id: "107",
//                     name: "Compliance",
//                     expanded: true,
//                     type: "department",
//                     children: [
//                       {
//                         id: "108",
//                         name: "James Harris",
//                         title: "Compliance Manager",
//                         email: "james.harris@vesa.com",
//                         photo: "https://primefaces.org/cdn/primereact/images/avatar/robertfisk.png",
//                         className: "manager-node",
//                         children: [
//                           {
//                             id: "109",
//                             name: "Elizabeth Taylor",
//                             title: "Compliance Specialist",
//                             email: "elizabeth.taylor@vesa.com",
//                             photo:
//                               "https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png",
//                             className: "employee-node",
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   },
// ];
