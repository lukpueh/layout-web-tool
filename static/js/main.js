$(function() {
  /*
   * Click listener to toggle option form in the option grid and toggle active
   * class.
   * Cases:
   * Form is shown (stays shown) if checkbox is checked
   * Form is hidden (stays hidden) if checkbox is unchecked
   * Form is toggled if click occurs outside of checkbox in the option cell
   */
  $(".opt-content").on("click", function(evt) {
    var $opt_form_cont = $(this).parent(".opt-cell").find(".opt-form-cont");

    // Hide all others
    $(".opt-form-cont").not($opt_form_cont).slideUp();
    $(".opt-content").not(this).removeClass("active");

    // If the checkbox is checked we always show (leave shown)
    // and hide (leave hidden) if unchecked.
    if (evt.target.type == "checkbox") {
      if (evt.target.checked) {
        $opt_form_cont.slideDown();
        $(this).addClass("active");

      } else {
        $opt_form_cont.slideUp();
        $(this).removeClass("active");
      }
    // If something other than a checkbox is clicked we just toggle
    } else {
      $opt_form_cont.slideToggle();
      $(this).toggleClass("active");
    }
  });

  /*
   * Click listener to clone an html template found by the selector stored in
   * the clicked element's `data-templatesource` attribute and append it to
   * an `data-templatedest`
   * Important: the selectors should each match only one element
   */
  $(".add-btn").on("click", function(evt){
    var template_src_selector = $(this).data("templatesource");
    var template_dest_selector = $(this).data("templatedest");

    $(".template" + template_src_selector)
        .clone()
        .appendTo(template_dest_selector)
        .slideDown(function(){
          $(this).removeClass("template");
        })

    // If the added item was sortable, re-initialize the sort container
    if ($(template_src_selector).parents(".sort-container").length) {
      sortable(".sort-container")
    }
  });

  /*
   * Click listener to hide and remove closest (up the DOM) element matched by
   * the clicked element's `data-toremove` attribute.
   */
  $(document).on("click", "button.rm-btn", function(evt) {
    var element_to_remove_selector = $(this).data("toremove");

    $(this).closest(element_to_remove_selector).slideUp(function(){
      $(this).remove();
    });
  });


  /*
   * Initialize drag and drop sorting
   * Note: Needs to be re-initialized when elements are added
   */
   sortable(".sort-container", {
      forcePlaceholderSize: true,
      placeholderClass: "sort-placeholder",
   });


  /* Turn pre element (code) into textarea on click and select code.
   * Nice for copy paste snippets
   */
  $("pre.code").click(function(){
    // Cache old elements attributes (e.g. class)
    var attrs = {};
    $.each(this.attributes, function(idx, attr) {
        attrs[attr.nodeName] = attr.nodeValue;
    });

    // Add disable spellcheck attribute
    attrs["spellcheck"] = "false";

    // Create new element
    $textarea = $("<textarea />", attrs)
      .height($(this).outerHeight())
      .prop("readonly", true)
      .append($(this).html());

    // Remove old element from DOM and insert new
    $(this).replaceWith($textarea);

    // Select the contents
    $textarea.select();

  });
});


  /*
   * Draw in-toto layout graph using D3.js
   * FIXME: modularize don't use data from global variable `layout_data`
   * (c.f. software_supply_chain.html)
   */
var draw_graph = function(graph_data) {
  // Create a new directed acyclic graph (dag)
  var dag = new dagreD3.graphlib.Graph({compound: true, multigraph: true})

  // Create a left to right layout
  dag.setGraph({
    nodesep: 5,
    ranksep: 40,
    edgesep: 10,
    rankdir: "RL",
  });

  // Create links between "child-nodes" (materials or products) of steps or
  // inspections
  // identified as <source_type>_<node name>, where source_type is "M" or "P".
  graph_data.links.forEach(function(link){
    dag.setEdge(link.source_type + "_" + link.source,
        link.dest_type + "_" + link.dest,
      {
        lineInterpolate: "basis"
        // TODO: we could display the path pattern as label
        //label: "..."
      });
  });

  // Create nodes (steps and inspections) based on passed nodes data and
  // child-nodes (materials and products) based on passed links.
  // I.e. a step that e.g. has not material_matchrule, or hasn't got its
  // materials matched by another step, doesn't get a material subnode.
  graph_data.nodes.forEach(function(node) {

    // Create regular node (step or inspection)
    dag.setNode(node.name, {label: node.name, clusterLabelPos: 'top'});

    // Create material or product child node only if they have a degree > 0
    ["M", "P"].forEach(function(prefix) {
      var node_child = prefix + "_" + node.name;
      if (dag.nodeEdges(node_child)) {
        dag.setNode(node_child, {label: prefix, shape: "circle"});
        dag.setParent(node_child, node.name);
      }
    })
  });

  // The SVG element
  var svg = d3.select("svg.svg-content");

  // An SVG group element that wraps the graph
  var inner = svg.append("g");

  // Set up drag/drop/zoom support
  var zoom = d3.behavior.zoom().on("zoom", function() {
        inner.attr("transform", "translate(" + d3.event.translate + ")" +
                                    "scale(" + d3.event.scale + ")");
      });
  svg.call(zoom);

  // Create the renderer ...
  var render = new dagreD3.render();

  // ... and run it to draw the graph.
  render(inner, dag);

  /* Scale and Center  graph */

  // Cache the SVG's container to access its width and height
  // this is where the svg is visible
  var $outer = $(".svg-container");

  // Get width and height of the graph
  // Note: D3 elements are lists of objects having the DOM element at idx 1
  var inner_rect = inner[0][0].getBoundingClientRect();

  // Padding in pixels
  var padding = 50;

  // Calculate how much we have to scale the graph up or down to fit the
  // container
  var scale = Math.min(($outer.width() - padding) / inner_rect.width,
      ($outer.height() - padding) / inner_rect.height);

  // Calculate distance from top and left to center the graph
  // Note: We have to translate between viewport and user coordinate system
  var top = ($outer.height() - inner_rect.height * scale) / 2;
  var left = ($outer.width() - inner_rect.width * scale) / 2;

  // Do the actual translate and scale
  zoom.translate([left, top]).scale(scale).event(svg);

  d3.selection.prototype.toFront = function() {
     /*
      * D3 selection extension to re-locate an element
      * to be the last child.
      */
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

  // Re-order SVG items - no z-index in SVG :(
  d3.select(".clusters").toFront();
  d3.select(".edgePaths").toFront();
}


