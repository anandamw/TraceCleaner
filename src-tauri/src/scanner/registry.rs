use serde::{Deserialize, Serialize};

#[cfg(target_os = "windows")]
use winreg::enums::*;
                        install_size_bytes: None,
                        is_64bit: None,
                        source: "registry".to_string(),
                    };
                    apps.push(app);
                }
            }
        }
    }

    Ok(apps)
}
