const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "padaria_db"
});

const funcionariosSchema = {
  ready: false,
  columns: new Set(),
};

const POSSIBLE_FUNCIONARIOS_COLUMNS = [
  "id",
  "nome",
  "email",
  "senha",
  "cargo",
  "telefone",
  "cpf",
  "rg",
  "numero_funcionario",
  "numeroFuncionario",
  "data_cadastro",
  "dataCadastro",
];

function loadFuncionariosSchema(callback = () => {}) {
  db.query("SHOW COLUMNS FROM funcionarios", (err, results) => {
    if (err) {
      console.error("❌ Erro ao ler schema de funcionarios:", err.message);
      funcionariosSchema.ready = false;
      return callback(err);
    }

    funcionariosSchema.columns = new Set(results.map((row) => row.Field));
    funcionariosSchema.ready = true;
    callback(null, Array.from(funcionariosSchema.columns));
  });
}

function ensureFuncionariosSchemaLoaded(callback) {
  if (funcionariosSchema.ready) {
    return callback(null, Array.from(funcionariosSchema.columns));
  }

  loadFuncionariosSchema((err, columns) => {
    if (err) return callback(err);
    callback(null, columns);
  });
}

function hasFuncionarioColumn(column) {
  return funcionariosSchema.columns.has(column);
}

function mapFuncionarioRow(row) {
  return {
    id: row.id,
    nome: row.nome || "",
    email: row.email || "",
    senha: row.senha || "",
    cargo: row.cargo || "",
    telefone: row.telefone || "",
    cpf: row.cpf || "",
    rg: row.rg || "",
    numeroFuncionario: row.numero_funcionario || row.numeroFuncionario || "",
    dataCadastro: row.data_cadastro || row.dataCadastro || null,
  };
}

function getInsertOrUpdateFields(payload, { includeSenha = true } = {}) {
  const data = [];
  const normalized = {
    nome: payload.nome ? String(payload.nome).trim() : "",
    email: payload.email ? String(payload.email).trim() : "",
    senha: payload.senha ? String(payload.senha).trim() : "",
    cargo: payload.cargo ? String(payload.cargo).trim() : "",
    telefone: payload.telefone ? String(payload.telefone).trim() : "",
    cpf: payload.cpf ? String(payload.cpf).trim() : "",
    rg: payload.rg ? String(payload.rg).trim() : "",
    numeroFuncionario: payload.numeroFuncionario ? String(payload.numeroFuncionario).trim() : "",
  };

  if (hasFuncionarioColumn("nome")) data.push(["nome", normalized.nome]);
  if (hasFuncionarioColumn("email")) data.push(["email", normalized.email]);

  if (includeSenha && normalized.senha && hasFuncionarioColumn("senha")) {
    data.push(["senha", normalized.senha]);
  }

  if (hasFuncionarioColumn("cargo")) data.push(["cargo", normalized.cargo]);
  if (hasFuncionarioColumn("telefone")) data.push(["telefone", normalized.telefone]);
  if (hasFuncionarioColumn("cpf")) data.push(["cpf", normalized.cpf]);
  if (hasFuncionarioColumn("rg")) data.push(["rg", normalized.rg]);

  if (normalized.numeroFuncionario) {
    if (hasFuncionarioColumn("numero_funcionario")) {
      data.push(["numero_funcionario", normalized.numeroFuncionario]);
    } else if (hasFuncionarioColumn("numeroFuncionario")) {
      data.push(["numeroFuncionario", normalized.numeroFuncionario]);
    }
  }

  return data;
}

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar:", err);
  } else {
    console.log("✅ Conectado ao banco padaria_db!");
    loadFuncionariosSchema(() => {});
  }
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Servidor ativo" });
});

app.get("/funcionarios", (req, res) => {
  ensureFuncionariosSchemaLoaded((schemaErr) => {
    if (schemaErr) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível ler a estrutura da tabela funcionarios."
      });
    }

    const columns = POSSIBLE_FUNCIONARIOS_COLUMNS.filter((column) =>
      hasFuncionarioColumn(column)
    );

    if (!columns.includes("id") || !columns.includes("nome") || !columns.includes("email")) {
      return res.status(500).json({
        success: false,
        error: "A tabela funcionarios precisa ter pelo menos as colunas id, nome e email.",
      });
    }

    const sql = `SELECT ${columns.join(", ")} FROM funcionarios ORDER BY nome ASC`;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("❌ ERRO LISTAR FUNCIONARIOS:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({ success: true, funcionarios: results.map(mapFuncionarioRow) });
    });
  });
});

app.post("/funcionarios", (req, res) => {
  console.log("🔥 BODY RECEBIDO:", req.body);

  ensureFuncionariosSchemaLoaded((schemaErr) => {
    if (schemaErr) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível ler a estrutura da tabela funcionarios."
      });
    }

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        error: "Nome, e-mail e senha são obrigatórios."
      });
    }

    const sqlCheck = "SELECT id FROM funcionarios WHERE email = ? LIMIT 1";

    db.query(sqlCheck, [String(email).trim()], (err, existing) => {
      if (err) {
        console.error("❌ ERRO CHECK EMAIL:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Este e-mail já está em uso."
        });
      }

      const fields = getInsertOrUpdateFields(req.body, {
        includeSenha: true,
      });

      const columns = fields.map(([column]) => column);
      const values = fields.map(([, value]) => value);

      if (columns.length === 0) {
        return res.status(500).json({
          success: false,
          error: "Nenhuma coluna compatível foi encontrada para inserir funcionário."
        });
      }

      const placeholders = columns.map(() => "?").join(", ");
      const sql = `INSERT INTO funcionarios (${columns.join(", ")}) VALUES (${placeholders})`;

      console.log("🔥 SQL INSERT:", sql);
      console.log("🔥 VALUES:", values);

      db.query(sql, values, (insertErr, result) => {
        if (insertErr) {
          console.error("❌ ERRO INSERT:", insertErr);
          return res.status(500).json({ success: false, error: insertErr.message });
        }

        console.log("✅ INSERT OK:", result);

        res.status(201).json({
          success: true,
          message: "Funcionário cadastrado com sucesso!",
          funcionarioId: result.insertId
        });
      });
    });
  });
});

app.put("/funcionarios/:id", (req, res) => {
  ensureFuncionariosSchemaLoaded((schemaErr) => {
    if (schemaErr) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível ler a estrutura da tabela funcionarios."
      });
    }

    const { id } = req.params;
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        error: "Nome e e-mail são obrigatórios."
      });
    }

    const sqlCheck = "SELECT id FROM funcionarios WHERE email = ? AND id <> ? LIMIT 1";

    db.query(sqlCheck, [String(email).trim(), id], (err, existing) => {
      if (err) {
        console.error("❌ ERRO CHECK EMAIL UPDATE:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Este e-mail já está em uso por outro funcionário."
        });
      }

      const fields = getInsertOrUpdateFields(req.body, {
        includeSenha: true,
      });

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nenhum campo válido foi enviado para atualização."
        });
      }

      const setClause = fields.map(([column]) => `${column} = ?`).join(", ");
      const values = fields.map(([, value]) => value);
      values.push(id);

      const sql = `UPDATE funcionarios SET ${setClause} WHERE id = ?`;

      db.query(sql, values, (updateErr, result) => {
        if (updateErr) {
          console.error("❌ ERRO UPDATE FUNCIONARIO:", updateErr);
          return res.status(500).json({ success: false, error: updateErr.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            error: "Funcionário não encontrado."
          });
        }

        res.json({
          success: true,
          message: "Funcionário atualizado com sucesso!"
        });
      });
    });
  });
});

app.delete("/funcionarios/:id", (req, res) => {
  ensureFuncionariosSchemaLoaded((schemaErr) => {
    if (schemaErr) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível ler a estrutura da tabela funcionarios."
      });
    }

    const { id } = req.params;

    db.query("DELETE FROM funcionarios WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("❌ ERRO DELETE FUNCIONARIO:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Funcionário não encontrado."
        });
      }

      res.json({
        success: true,
        message: "Funcionário excluído com sucesso!"
      });
    });
  });
});

app.get("/produtos", (req, res) => {
  const sql = `
    SELECT id, nome, categoria, preco_venda, preco_custo, estoque, codigo_produto, descricao, data_cadastro
    FROM produtos
    ORDER BY nome ASC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, produtos: results });
  });
});

app.post("/produtos", (req, res) => {
  const {
    nome,
    nome_produto,
    categoria,
    preco_venda,
    preco_produto,
    preco_custo,
    estoque,
    quantidade_estoque,
    codigo_produto,
    descricao,
  } = req.body;

  const nomeFinal = (nome || nome_produto || "").trim();
  const categoriaFinal = (categoria || "").trim();
  const precoVendaFinal = Number(preco_venda ?? preco_produto ?? 0);
  const precoCustoFinal = Number(preco_custo ?? 0);
  const estoqueFinal = Number(estoque ?? quantidade_estoque ?? 0);
  const codigoProdutoFinal = codigo_produto ? String(codigo_produto).trim() : null;
  const descricaoFinal = descricao ? String(descricao).trim() : null;

  if (!nomeFinal || !categoriaFinal || Number.isNaN(precoVendaFinal) || precoVendaFinal <= 0) {
    return res.status(400).json({
      success: false,
      error: "Nome, categoria e preço de venda válidos são obrigatórios.",
    });
  }

  const sql = `
    INSERT INTO produtos
      (nome, categoria, preco_venda, preco_custo, estoque, codigo_produto, descricao, data_cadastro)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const params = [
    nomeFinal,
    categoriaFinal,
    precoVendaFinal,
    Number.isNaN(precoCustoFinal) ? 0 : precoCustoFinal,
    Number.isNaN(estoqueFinal) ? 0 : estoqueFinal,
    codigoProdutoFinal,
    descricaoFinal,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    res.status(201).json({
      success: true,
      message: "Produto cadastrado com sucesso!",
      produtoId: result.insertId,
    });
  });
});

app.get("/vendas/dia", (req, res) => {
  const sql = `
    SELECT v.id, v.data_venda, v.total as total_venda, v.forma_pagamento,
           COALESCE(GROUP_CONCAT(CONCAT(iv.quantidade, 'x ', p.nome) SEPARATOR ' | '), '') as itens
    FROM vendas v
    LEFT JOIN itens_venda iv ON v.id = iv.venda_id
    LEFT JOIN produtos p ON iv.produto_id = p.id
    WHERE DATE(v.data_venda) = CURDATE()
    GROUP BY v.id
    ORDER BY v.data_venda DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, vendas: results });
  });
});

app.get("/vendas/consultar", (req, res) => {
  const { dataInicio, dataFim } = req.query;
  let sql = `
    SELECT v.*,
           COALESCE(GROUP_CONCAT(CONCAT(iv.quantidade, 'x ', p.nome) SEPARATOR ' | '), '') as itens
    FROM vendas v
    LEFT JOIN itens_venda iv ON v.id = iv.venda_id
    LEFT JOIN produtos p ON iv.produto_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (dataInicio) {
    sql += " AND DATE(v.data_venda) >= ?";
    params.push(dataInicio);
  }

  if (dataFim) {
    sql += " AND DATE(v.data_venda) <= ?";
    params.push(dataFim);
  }

  sql += " GROUP BY v.id ORDER BY v.data_venda DESC";

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, vendas: results });
  });
});

app.post("/venda", (req, res) => {
  const { itens, total, formaPagamento } = req.body;

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      success: false,
      error: "A venda precisa ter pelo menos um item."
    });
  }

  if (!formaPagamento) {
    return res.status(400).json({
      success: false,
      error: "Forma de pagamento é obrigatória."
    });
  }

  const totalFinal = Number(total);
  if (Number.isNaN(totalFinal) || totalFinal <= 0) {
    return res.status(400).json({
      success: false,
      error: "Total da venda inválido."
    });
  }

  const sqlVenda = "INSERT INTO vendas (data_venda, total, forma_pagamento) VALUES (NOW(), ?, ?)";

  db.query(sqlVenda, [totalFinal, formaPagamento], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    const idVenda = result.insertId;
    let processados = 0;
    let houveErro = false;

    itens.forEach((item) => {
      const quantidade = Number(item.quantidade);
      const preco = Number(item.preco);
      const subtotal = quantidade * preco;

      const sqlItem = `
        INSERT INTO itens_venda (venda_id, produto_id, quantidade, valor_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(sqlItem, [idVenda, item.id, quantidade, preco, subtotal], (erroItem) => {
        if (erroItem) {
          console.error("Erro ao inserir item:", erroItem);
          houveErro = true;
          processados += 1;

          if (processados === itens.length) {
            return res.status(500).json({
              success: false,
              error: "Erro ao inserir itens da venda."
            });
          }
          return;
        }

        const sqlEstoque = "UPDATE produtos SET estoque = estoque - ? WHERE id = ?";

        db.query(sqlEstoque, [quantidade, item.id], (erroEstoque) => {
          if (erroEstoque) {
            console.error("Erro ao atualizar estoque:", erroEstoque);
            houveErro = true;
          }

          processados += 1;

          if (processados === itens.length && !houveErro) {
            res.json({
              success: true,
              message: "Venda finalizada com sucesso!",
              vendaId: idVenda
            });
          } else if (processados === itens.length && houveErro) {
            res.status(500).json({
              success: false,
              error: "Venda registrada parcialmente. Verifique os itens/estoque."
            });
          }
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
