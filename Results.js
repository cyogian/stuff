import {
  Checkbox,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AreaHighlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
} from "react-pdf-highlighter";
import { useDispatch, useSelector } from "react-redux";
import links from "../../../links";
import { colors } from "../../../mui/theme";
import {
  selectDocument,
  selectDocumentError,
  selectDocumentLoading,
  viewDocument,
} from "../../../redux/slices/docSlice";
import { PDFFindController } from "pdfjs-dist/web/pdf_viewer";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
const useStyles = makeStyles((theme) => ({
  container: {
    height: "100%",
    display: "flex",
    padding: "0.5rem",
    "& > div": {
      width: "50%",
      height: "calc(100% - 1rem)",
      borderRadius: "16px",
      margin: "0.5rem",
      padding: "1rem",
    },
  },
  tableContainer: {
    background: `${theme.palette.common.stride_light_white}`,
  },
  viewerContainer: {
    background: `${theme.palette.common.stride_light_black}`,
  },
  tableBox: {
    height: "calc(100% - 3rem)",
    marginTop: "1.5rem",
    overflow: "auto",
  },
  strideH2Medium: {
    ...theme.typography.stride_h2_medium,
  },
  dpNo: {
    ...theme.typography.stride_h3_medium,
    color: "black",
  },
  tableHead: {
    ...theme.typography.stride_h3_medium,
    background: `${theme.palette.common.stride_light_black}`,
    position: "sticky",
    top: "0",
  },
  headCell: {
    color: `${theme.palette.common.stride_light_white}`,
    padding: "0.5rem",
  },
  strideBodyRegular: {
    ...theme.typography.stride_body_regular,
  },
  strideBodyLight16: {
    ...theme.typography.stride_body_light_16pt,
  },
  bbox: {
    cursor: "pointer",
    color: `${theme.palette.common.stride_iris}`,
  },
  check: {
    padding: "0 8px 0 0",
  },
  search: {
    paddingLeft: "1rem",
    maxWidth: "240px",
    textAlign: "center",
    position: "relative",
  },
  searchRoot: {
    color: "#DDDDDD",
    borderRadius: "8px",
    border: "1px solid #DDDDDD",
    "&:before": {
      borderBottom: "none !important",
      transition: "none !important",
    },
    "&:after": {
      borderBottom: "none !important",
      transition: "none !important",
    },
    maxWidth: "12rem",
  },
  searchNav: {
    position: "absolute",
    left: "calc(50% - 28px)",
    top: "100%",
    zIndex: "10",
    background: "#333333",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
    color: "#dddddd",
    "& > button": {
      padding: "0.5rem",
    },
  },
  pageInput: {
    background: "none",
    textAlign: "right",
    fontSize: "inherit",
    fontWeight: "inherit",
    outline: "none",
    color: "#DDDDDD",
    "&::-webkit-outer-spin-button": {
      "-webkit-appearance": "none",
      margin: 0,
    },
    "&::-webkit-inner-spin-button": {
      "-webkit-appearance": "none",
      margin: 0,
    },
    "-moz-appearance": "textfield",
    boxShadow: "none",
    border: "none",
    borderBottom: "1px solid #DDDDDD",
  },
  scaleSelect: {
    background: "none",
    border: "none",
    color: "#DDDDDD",
    "& > option": {
      color: "black",
    },
    outline: "none",
    textAlign: "center",
  },
}));

export default function Results(props) {
  const classes = useStyles();
  const [highlights, setHighlights] = useState([]);
  const docId = props.match.params.docId.trim();
  const doc = useSelector(selectDocument);
  const docLoading = useSelector(selectDocumentLoading);
  const docError = useSelector(selectDocumentError);
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchField, setSearchField] = useState("");
  const [scale, setScale] = useState("auto");
  useEffect(() => {
    docId && dispatch(viewDocument(docId));
  }, [docId, dispatch]);
  useEffect(() => {
    setPageInput(page);
  }, [page]);
  const bboxToHighlight = (obj) => {
    const [x1, _y1, x2, _y2] = obj.bbox;
    const [px1, py1, px2, py2] = obj.page_bbox;
    const width = Math.abs(px2 - px1);
    const height = Math.abs(py2 - py1);
    const y2 = height - _y1;
    const y1 = height - _y2;
    return {
      content: {
        image: "",
      },
      position: {
        boundingRect: {
          x1,
          y1,
          x2,
          y2,
          width,
          height,
        },
        rects: [],
        pageNumber: obj.page_no + 1,
        id: "currentHighlight",
      },
    };
  };
  const highlightToBbox = (position) => {
    const {
      pageNumber,
      boundingRect: { x1, y1, x2, y2, width, height },
    } = position;
    return {
      bbox: [x1, height - y2, x2, height - y1],
      page_no: pageNumber - 1,
      page_bbox: [0, 0, width, height],
    };
  };
  const pdfHighlighter = useRef(null);
  const scrollToHighlight = useCallback(() => {
    const highlight = highlights[0];
    if (highlight) {
      pdfHighlighter.current?.scrollTo(highlight);
    }
  }, [highlights, pdfHighlighter]);

  useEffect(() => {
    scrollToHighlight();
  }, [scrollToHighlight]);

  const onChangeHighlight = (obj) => {
    setHighlights([bboxToHighlight(obj)]);
  };

  const bboxList = (bbox_objects = [], name = "") => {
    const dps = bbox_objects.map((obj, i) => {
      return (
        <Typography
          key={`${name}_${obj.dp_value}_${i}`}
          onClick={(e) => {
            onChangeHighlight(obj);
          }}
          className={classes.bbox}
        >
          {obj.text}
        </Typography>
      );
    });
    return (
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <Checkbox
          disableRipple
          color="primary"
          classes={{ root: classes.check }}
        />
        <div>{dps}</div>
      </div>
    );
  };
  const tableBody = ({ file_name, ...dataPoints }) => {
    const list = Object.keys(dataPoints).map((k) => {
      const dp = dataPoints[k];
      return (
        <TableRow
          key={`datapoint:${k}:${dp.dp_name}`}
          style={{ verticalAlign: "top" }}
        >
          <TableCell>
            <Typography className={classes.dpNo}>{Number(k) + 1}.</Typography>
          </TableCell>
          <TableCell>
            <Typography key={`${dp.dp_name}`} className={classes.dpNo}>
              {dp.dp_name}
            </Typography>
          </TableCell>
          <TableCell>{bboxList(dp.bbox_objects, dp.dp_name)}</TableCell>
        </TableRow>
      );
    });
    return <TableBody>{list}</TableBody>;
  };
  const onPageChange = (evt) => {
    setPage(evt.pageNumber);
  };
  const onPageInputChange = (evt) => {
    if (totalPages >= evt.target.value >= 1) {
      document
        .querySelector(`[data-page-number="${evt.target.value}"]`)
        ?.scrollIntoView();
    } else {
      setPageInput(page);
    }
  };
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfFindController, setPdfFindController] = useState(null);

  // Initializing PDFViewer
  useEffect(() => {
    if (pdfDocument) {
      const { numPages } = pdfDocument._pdfInfo;
      if (pdfHighlighter?.current) {
        const current = pdfHighlighter.current;
        current.eventBus.on("pagechanging", onPageChange);
        const linkService = current.linkService;
        const eventBus = current.eventBus;
        const findController = new PDFFindController({ linkService, eventBus });
        current.viewer.findController = findController;
        setPdfFindController(findController);
      }
      setTotalPages(numPages);
      setPage(numPages ? 1 : 0);
    }
  }, [pdfDocument]);

  // Scale Change (Zoom)
  useEffect(() => {
    if (pdfHighlighter.current)
      pdfHighlighter.current.viewer.currentScaleValue = scale;
  }, [scale, pdfHighlighter]);

  // Search Field Change
  useEffect(() => {
    if (pdfFindController)
      pdfFindController.executeCommand("find", {
        query: searchField,
        highlightAll: true,
        phraseSearch: true,
      });
  }, [searchField, pdfDocument, pdfFindController, pdfHighlighter]);

  return (
    <div className={classes.container}>
      <div className={classes.tableContainer}>
        <Grid container alignItems="center" style={{ margin: "0.5rem 0" }}>
          <Grid item>
            <Typography
              className={classes.strideH2Medium}
              style={{
                color: "black",
                display: "flex",
                alignItems: "center",
                width: "fit-content",
              }}
            >
              Results &nbsp;
              <img src={links.chevronRight} alt="chevronRight" />
            </Typography>
          </Grid>
          <Grid item style={{ padding: "0 2rem", width: "calc(100% - 240px)" }}>
            <Typography
              className={classes.strideBodyRegular}
              style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
              title={doc?.data?.file_name}
            >
              {docLoading || doc?.data?.file_name}
            </Typography>
          </Grid>
          <Grid item>
            <Typography
              className={classes.strideBodyLight16}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#333333",
              }}
            >
              <img
                src={links.downloadIcon1}
                alt="DownloadIcon"
                style={{ marginRight: "0.5rem" }}
              />
              Download
            </Typography>
          </Grid>
        </Grid>
        {docLoading ? (
          <div
            style={{
              display: "flex",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </div>
        ) : (
          <TableContainer className={classes.tableBox}>
            <Table>
              <TableHead className={classes.tableHead}>
                <TableRow>
                  <TableCell
                    className={classes.headCell}
                    style={{ width: "4rem" }}
                  >
                    No.
                  </TableCell>
                  <TableCell
                    className={classes.headCell}
                    style={{ width: "40%" }}
                  >
                    Data Point
                  </TableCell>
                  <TableCell className={classes.headCell}>Value</TableCell>
                </TableRow>
              </TableHead>
              {doc.data && tableBody(doc.data)}
            </Table>
          </TableContainer>
        )}
      </div>
      <div className={classes.viewerContainer}>
        <Grid
          container
          alignItems="center"
          justifyContent="space-around"
          style={{ position: "relative" }}
        >
          <Grid item>
            <Typography
              className={classes.strideH2Medium}
              style={{
                color: colors.stride_lighter_grey,
                display: "flex",
                alignItems: "center",
                width: "fit-content",
              }}
            >
              <img src={links.chevronRightLight} alt="chevronRight" />{" "}
              &nbsp;&nbsp; Document
            </Typography>
          </Grid>
          <Grid xs={true} item className={classes.search}>
            <TextField
              onChange={(e) => setSearchField(e.target.value)}
              title={searchField}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) {
                    pdfFindController?.executeCommand("findagain", {
                      query: searchField,
                      phraseSearch: true,
                      highlightAll: true,
                      findPrevious: true,
                    });
                  } else {
                    pdfFindController?.executeCommand("findagain", {
                      query: searchField,
                      phraseSearch: true,
                      highlightAll: true,
                      findPrevious: false,
                    });
                  }
                }
              }}
              value={searchField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon style={{ marginLeft: "0.5rem" }} />
                  </InputAdornment>
                ),
                placeholder: "Search",
                classes: {
                  root: classes.searchRoot,
                },
              }}
              fullWidth
              classes={{
                root: classes.searchRoot,
              }}
            />
            <div className={classes.searchNav}>
              <IconButton
                onClick={() => {
                  pdfFindController?.executeCommand("findagain", {
                    query: searchField,
                    phraseSearch: true,
                    highlightAll: true,
                    findPrevious: true,
                  });
                }}
              >
                <ArrowUpward style={{ color: "#DDDDDD" }} fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => {
                  pdfFindController?.executeCommand("findagain", {
                    query: searchField,
                    highlightAll: true,
                    phraseSearch: true,
                  });
                }}
              >
                <ArrowDownward style={{ color: "#DDDDDD" }} fontSize="small" />
              </IconButton>
            </div>
          </Grid>
          <Grid item style={{ color: "white" }}>
            <IconButton
              onClick={() => {
                document
                  .querySelector(`[data-page-number="${page - 1}"]`)
                  ?.scrollIntoView({
                    // behavior: "smooth",
                  });
              }}
              disabled={page <= 1}
            >
              <img src={links.previousPage} alt="previousPage" />
            </IconButton>
            <input
              value={pageInput}
              type="number"
              disabled={!(totalPages > 0)}
              onChange={(e) => {
                if (
                  e.target.valueAsNumber > 0 &&
                  e.target.value.length <= totalPages.toString().length
                )
                  setPageInput(e.target.value);
                else if (e.target.value === "") setPageInput(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  onPageInputChange(e);
                }
              }}
              className={classes.pageInput}
              style={{
                width: `${
                  (pageInput && pageInput.toString().length > 1
                    ? pageInput.toString().length
                    : 2) * 11
                }px`,
              }}
            />{" "}
            of {totalPages}
            <IconButton
              onClick={() => {
                document
                  .querySelector(`[data-page-number="${page + 1}"]`)
                  ?.scrollIntoView({
                    // behavior: "smooth",
                  });
              }}
              disabled={page >= totalPages}
            >
              <img src={links.nextPage} alt="nextPage" />
            </IconButton>
          </Grid>
          <Grid
            item
            container
            style={{ width: "fit-content" }}
            alignItems="center"
          >
            <ZoomInIcon style={{ color: "#DDDDDD" }} />
            <select
              id="scaleSelect"
              title="Zoom"
              data-l10n-id="zoom"
              onChange={(e) => setScale(e.target.value)}
              value={scale}
              className={classes.scaleSelect}
            >
              <option
                id="pageAutoOption"
                title=""
                value="auto"
                data-l10n-id="page_scale_auto"
              >
                Auto Zoom
              </option>
              <option
                id="pageActualOption"
                title=""
                value="page-actual"
                data-l10n-id="page_scale_actual"
              >
                Actual Size
              </option>
              <option
                id="pageFitOption"
                title=""
                value="page-fit"
                data-l10n-id="page_scale_fit"
              >
                Page Fit
              </option>
              <option
                id="pageWidthOption"
                title=""
                value="page-width"
                data-l10n-id="page_scale_width"
              >
                Page Width
              </option>
              <option
                id="customScaleOption"
                title=""
                value="custom"
                disabled="disabled"
                hidden={true}
              ></option>
              <option
                title=""
                value="0.5"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 50 }'
              >
                50%
              </option>
              <option
                title=""
                value="0.75"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 75 }'
              >
                75%
              </option>
              <option
                title=""
                value="1"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 100 }'
              >
                100%
              </option>
              <option
                title=""
                value="1.25"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 125 }'
              >
                125%
              </option>
              <option
                title=""
                value="1.5"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 150 }'
              >
                150%
              </option>
              <option
                title=""
                value="2"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 200 }'
              >
                200%
              </option>
              <option
                title=""
                value="3"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 300 }'
              >
                300%
              </option>
              <option
                title=""
                value="4"
                data-l10n-id="page_scale_percent"
                data-l10n-args='{ "scale": 400 }'
              >
                400%
              </option>
            </select>
          </Grid>
        </Grid>
        <div
          style={{
            width: "100%",
            height: "calc(100% - 5rem)",
            position: "relative",
            marginTop: "2rem",
          }}
        >
          <PdfLoader
            url={`/api/files/getFile/${docId}`}
            beforeLoad={
              <div style={{ textAlign: "center" }}>
                <CircularProgress />
              </div>
            }
            style={{ width: "100%", height: "100%" }}
          >
            {(pdfDocument) => {
              setPdfDocument(pdfDocument);
              return (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  pdfScaleValue={scale}
                  highlights={highlights}
                  enableAreaSelection={(e) => true}
                  ref={pdfHighlighter}
                  scrollRef={() => {
                    scrollToHighlight();
                  }}
                  onSelectionFinished={(
                    position
                    // hideTipAndSelection,
                    // transformSelection
                  ) => {
                    console.log(highlightToBbox(position));
                  }}
                  onScrollChange={() => {}}
                  style={{ width: "100%", height: "100%" }}
                  highlightTransform={(
                    highlight,
                    index,
                    // setTip,
                    // hideTip,
                    // viewportToScaled,
                    isScrolledTo
                  ) => {
                    const component = (
                      <AreaHighlight
                        isScrolledTo={false}
                        highlight={highlight}
                        onChange={() => {}}
                        {...{ disableDragging: true, enableResizing: false }}
                      />
                    );

                    return (
                      <Popup
                        popupContent={""}
                        onMouseOver={(popupContent) => {
                          // setTip(highlight, (highlight) => popupContent);
                        }}
                        onMouseOut={() => {
                          // hideTip();
                        }}
                        key={index}
                        children={component}
                      />
                    );
                  }}
                />
              );
            }}
          </PdfLoader>
        </div>
      </div>
    </div>
  );
}
