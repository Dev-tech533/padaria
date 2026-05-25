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

const REQUIRED_FUNCIONARIOS_COLUMNS = [
  { name: "cpf", definition: "VARCHAR(20) NULL AFTER telefone" },
  { name: "rg", definition: "VARCHAR(20) NULL AFTER cpf" },
  { name: "numero_funcionario", definition: "VARCHAR(30) NULL AFTER rg" },
];

function ensureFuncionariosTableStructure(callback = () => {}) {
  db.query("SHOW COLUMNS FROM funcionarios", (err, results) => {
    if (err) {
      console.error("❌ Erro ao verificar estrutura de funcionarios:", err.message);
      return callback(err);
    }

    const existingColumns = new Set(results.map((row) => row.Field));
    const missingColumns = REQUIRED_FUNCIONARIOS_COLUMNS.filter(
      (column) => !existingColumns.has(column.name)
    );

    if (missingColumns.length === 0) {
      return loadFuncionariosSchema(callback);
    }

    const alterParts = missingColumns.map(
      (column) => `ADD COLUMN ${column.name} ${column.definition}`
    );

    const sql = `ALTER TABLE funcionarios ${alterParts.join(", ")}`;
    console.log("🔧 Ajustando tabela funcionarios:", sql);

    db.query(sql, (alterErr) => {
      if (alterErr) {
        console.error("❌ Erro ao ajustar tabela funcionarios:", alterErr.message);
        return callback(alterErr);
      }

      console.log("✅ Estrutura da tabela funcionarios atualizada.");
      loadFuncionariosSchema(callback);
    });
  });
}

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

  ensureFuncionariosTableStructure((err, columns) => {
    if (err) return callback(err);
    callback(null, columns);
  });
}

function hasFuncionarioColumn(column) {
  return funcionariosSchema.columns.has(column);
}

const produtosSchema = {
  ready: false,
  columns: new Set(),
};

const REQUIRED_PRODUTOS_COLUMNS = [
  { name: "descricao", definition: "VARCHAR(255) NOT NULL DEFAULT '' AFTER codigo_produto" },
  { name: "ativo", definition: "TINYINT(1) NOT NULL DEFAULT 1 AFTER descricao" },
];

function ensureProdutosTableStructure(callback = () => {}) {
  db.query("SHOW COLUMNS FROM produtos", (err, results) => {
    if (err) {
      console.error("❌ Erro ao verificar estrutura de produtos:", err.message);
      return callback(err);
    }

    const existingColumns = new Set(results.map((row) => row.Field));
    const missingColumns = REQUIRED_PRODUTOS_COLUMNS.filter(
      (column) => !existingColumns.has(column.name)
    );

    if (missingColumns.length === 0) {
      produtosSchema.columns = existingColumns;
      produtosSchema.ready = true;
      return callback(null, Array.from(produtosSchema.columns));
    }

    const alterParts = missingColumns.map(
      (column) => `ADD COLUMN ${column.name} ${column.definition}`
    );

    const sql = `ALTER TABLE produtos ${alterParts.join(", ")}`;
    console.log("🔧 Ajustando tabela produtos:", sql);

    db.query(sql, (alterErr) => {
      if (alterErr) {
        console.error("❌ Erro ao ajustar tabela produtos:", alterErr.message);
        return callback(alterErr);
      }

      db.query("UPDATE produtos SET descricao = '' WHERE descricao IS NULL", () => {
        loadProdutosSchema(callback);
      });
    });
  });
}

function loadProdutosSchema(callback = () => {}) {
  db.query("SHOW COLUMNS FROM produtos", (err, results) => {
    if (err) {
      console.error("❌ Erro ao ler schema de produtos:", err.message);
      produtosSchema.ready = false;
      return callback(err);
    }

    produtosSchema.columns = new Set(results.map((row) => row.Field));
    produtosSchema.ready = true;
    callback(null, Array.from(produtosSchema.columns));
  });
}

function ensureProdutosSchemaLoaded(callback) {
  if (produtosSchema.ready) {
    return callback(null, Array.from(produtosSchema.columns));
  }

  ensureProdutosTableStructure((err, columns) => {
    if (err) return callback(err);
    callback(null, columns);
  });
}

function hasProdutoColumn(column) {
  return produtosSchema.columns.has(column);
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
    numeroFuncionario: row.numero_funcionario || "",
    dataCadastro: row.data_cadastro || row.dataCadastro || null,
  };
}

function validarFuncionario(payload, { novo = false } = {}) {
  const nome = payload.nome ? String(payload.nome).trim() : "";
  const email = payload.email ? String(payload.email).trim() : "";
  const senha = payload.senha ? String(payload.senha).trim() : "";
  const cpf = payload.cpf ? String(payload.cpf).trim() : "";
  const rg = payload.rg ? String(payload.rg).trim() : "";
  const numeroFuncionario = payload.numeroFuncionario ? String(payload.numeroFuncionario).trim() : "";

  if (!nome || !email) return "Nome e e-mail são obrigatórios.";
  if (novo && !senha) return "Senha é obrigatória para novos usuários.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Digite um e-mail válido.";
  if (cpf && cpf.replace(/\D/g, "").length !== 11) return "CPF deve ter 11 números.";
  if (rg && rg.length < 4) return "RG deve ter pelo menos 4 caracteres.";
  if (numeroFuncionario && !/^[A-Za-z0-9_-]+$/.test(numeroFuncionario)) {
    return "Número do funcionário deve conter apenas letras, números, hífen ou underline.";
  }

  return null;
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
    ensureFuncionariosTableStructure(() => {});
    ensureProdutosTableStructure(() => {});
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

    const erroValidacao = validarFuncionario(req.body, { novo: true });
    if (erroValidacao) {
      return res.status(400).json({ success: false, error: erroValidacao });
    }

    const { email } = req.body;

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
    const erroValidacao = validarFuncionario(req.body, { novo: false });
    if (erroValidacao) {
      return res.status(400).json({ success: false, error: erroValidacao });
    }

    const { email } = req.body;

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
  ensureProdutosSchemaLoaded((schemaErr) => {
    if (schemaErr) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível ler a estrutura da tabela produtos."
      });
    }

    const whereAtivo = hasProdutoColumn("ativo") ? "WHERE ativo = 1" : "";
    const selectAtivo = hasProdutoColumn("ativo") ? ", ativo" : "";
    const selectDescricao = hasProdutoColumn("descricao") ? ", descricao" : ", '' AS descricao";

    const sql = `
      SELECT id, nome, categoria, preco_venda, preco_custo, estoque, codigo_produto${selectDescricao}, data_cadastro${selectAtivo}
      FROM produtos
      ${whereAtivo}
      ORDER BY nome ASC
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, produtos: results });
    });
  });
});

app.post("/produtos", (req, res) => {
  ensureProdutosSchemaLoaded((schemaErr) => {
    if (schemaErr) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível ler a estrutura da tabela produtos."
      });
    }

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
    const descricaoFinal = descricao ? String(descricao).trim() : "";

    if (!nomeFinal || !categoriaFinal || Number.isNaN(precoVendaFinal) || precoVendaFinal <= 0) {
      return res.status(400).json({
        success: false,
        error: "Nome, categoria e preço de venda válidos são obrigatórios.",
      });
    }

    if (Number.isNaN(estoqueFinal) || estoqueFinal < 0) {
      return res.status(400).json({
        success: false,
        error: "Estoque deve ser zero ou maior.",
      });
    }

    const columns = ["nome", "categoria", "preco_venda", "preco_custo", "estoque", "codigo_produto"];
    const values = [
      nomeFinal,
      categoriaFinal,
      precoVendaFinal,
      Number.isNaN(precoCustoFinal) ? 0 : precoCustoFinal,
      estoqueFinal,
      codigoProdutoFinal,
    ];

    if (hasProdutoColumn("descricao")) {
      columns.push("descricao");
      values.push(descricaoFinal);
    }

    if (hasProdutoColumn("ativo")) {
      columns.push("ativo");
      values.push(1);
    }

    columns.push("data_cadastro");
    values.push(new Date());

    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO produtos (${columns.join(", ")}) VALUES (${placeholders})`;

    db.query(sql, values, (err, result) => {
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
});


app.patch("/produtos/:id/remover-unidade", (req, res) => {
  const { id } = req.params;

  db.query("SELECT id, nome, estoque FROM produtos WHERE id = ? LIMIT 1", [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "Produto não encontrado." });
    }

    const produto = results[0];
    if (Number(produto.estoque) <= 0) {
      return res.status(400).json({ success: false, error: "Este produto já está com estoque zerado." });
    }

    db.query("UPDATE produtos SET estoque = estoque - 1 WHERE id = ?", [id], (updateErr) => {
      if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

      res.json({
        success: true,
        message: "Uma unidade foi removida do estoque.",
      });
    });
  });
});

app.delete("/produtos/:id", (req, res) => {
  const { id } = req.params;

  db.beginTransaction((transactionErr) => {
    if (transactionErr) {
      console.error("❌ ERRO AO INICIAR TRANSAÇÃO:", transactionErr);
      return res.status(500).json({
        success: false,
        error: "Não foi possível iniciar a exclusão do produto.",
      });
    }

    db.query("SELECT id FROM produtos WHERE id = ? LIMIT 1", [id], (selectErr, produtos) => {
      if (selectErr) {
        return db.rollback(() => {
          console.error("❌ ERRO AO LOCALIZAR PRODUTO:", selectErr);
          res.status(500).json({ success: false, error: "Erro ao localizar produto." });
        });
      }

      if (produtos.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ success: false, error: "Produto não encontrado." });
        });
      }

      db.query("DELETE FROM itens_venda WHERE produto_id = ?", [id], (itensErr) => {
        if (itensErr) {
          return db.rollback(() => {
            console.error("❌ ERRO AO REMOVER PRODUTO DAS VENDAS:", itensErr);
            res.status(500).json({
              success: false,
              error: "Não foi possível remover o produto das vendas antigas.",
            });
          });
        }

        db.query("DELETE FROM produtos WHERE id = ?", [id], (deleteErr, result) => {
          if (deleteErr) {
            return db.rollback(() => {
              console.error("❌ ERRO DELETE PRODUTO:", deleteErr);
              res.status(500).json({
                success: false,
                error: "Não foi possível excluir o produto do banco de dados.",
              });
            });
          }

          if (result.affectedRows === 0) {
            return db.rollback(() => {
              res.status(404).json({ success: false, error: "Produto não encontrado." });
            });
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error("❌ ERRO AO FINALIZAR EXCLUSÃO:", commitErr);
                res.status(500).json({
                  success: false,
                  error: "Erro ao finalizar exclusão do produto.",
                });
              });
            }

            res.json({
              success: true,
              message: "Produto excluído definitivamente do banco de dados.",
            });
          });
        });
      });
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